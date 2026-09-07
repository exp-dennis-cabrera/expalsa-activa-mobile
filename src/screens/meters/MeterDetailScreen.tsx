import { useCallback, useLayoutEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Modal, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, IconButton, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { metersApi, type Meter, type MeterTrigger, type MeterReading } from '../../api/meters';
import { useAuth } from '../../context/AuthContext';

function BasicField({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 14, color: '#6B7280' }}>{label}</Text>
      <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
        {value}
      </Text>
    </View>
  );
}

export default function MeterDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const theme = useTheme();
  const { hasDeletePermission } = useAuth();
  const [meter, setMeter] = useState<Meter | null>(null);
  const [triggers, setTriggers] = useState<MeterTrigger[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [readingValue, setReadingValue] = useState('');
  const [editingReading, setEditingReading] = useState<MeterReading | null>(null);
  const [editReadingValue, setEditReadingValue] = useState('');
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    metersApi.getById(id).then(setMeter).catch(() => {});
    metersApi.getTriggers(id).then(setTriggers).catch(() => {});
  }, [id]);

  useFocusEffect(load);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: meter?.name ?? 'Cargando…',
      headerRight: () => (meter ? <IconButton icon="dots-vertical" onPress={() => setActionsMenuOpen(true)} /> : null),
    });
  }, [navigation, meter]);

  async function handleAddReading() {
    // Antes se usaba "parseFloat(x) || 0": si el campo estaba vacio o el
    // texto no era un numero, se guardaba 0 SIN AVISAR. Eso ensucia el
    // historico y arruina el calculo de consumo (una lectura en 0 genera
    // un consumo negativo enorme al dia siguiente).
    const valor = parseFloat(readingValue.replace(',', '.'));
    if (!readingValue.trim() || Number.isNaN(valor)) {
      setError('Escribe un valor numérico para la lectura.');
      return;
    }
    if (valor < 0) {
      setError('La lectura no puede ser negativa.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await metersApi.addReading(id, valor);
      setMeter(updated);
      setAddModalOpen(false);
      setReadingValue('');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'No se pudo registrar la lectura.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditReading() {
    if (!editingReading) return;
    setSubmitting(true);
    try {
      const valorEditado = parseFloat(editReadingValue.replace(',', '.'));
      if (!editReadingValue.trim() || Number.isNaN(valorEditado) || valorEditado < 0) {
        setError('Escribe un valor numérico válido.');
        setSubmitting(false);
        return;
      }
      const updated = await metersApi.updateReading(editingReading.id, valorEditado);
      setMeter(updated);
      setEditingReading(null);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteReading(readingId: number) {
    Alert.alert('Eliminar lectura', '¿Seguro que quieres eliminar esta lectura?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await metersApi.deleteReading(readingId);
          load();
        },
      },
    ]);
  }

  function handleEdit() {
    setActionsMenuOpen(false);
    navigation.navigate('AddMeter', { meter });
  }

  function handleDeleteMeter() {
    setActionsMenuOpen(false);
    Alert.alert('Eliminar medidor', 'Esta acción no se puede deshacer. ¿Eliminar este medidor?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await metersApi.delete(id);
          navigation.goBack();
        },
      },
    ]);
  }

  if (!meter) {
    return (
      <View style={styles.center}>
        <Text>Cargando…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {meter.imageUrl && <Image source={{ uri: meter.imageUrl }} style={styles.headerImage} />}

      <BasicField label="Ubicación" value={meter.locationName} />
      <BasicField label="Activo" value={meter.assetName} />
      <BasicField label="Frecuencia de lectura" value={`Cada ${meter.updateFrequencyDays} día(s)`} />
      <BasicField label="Última lectura" value={meter.lastReading != null ? `${meter.lastReading} ${meter.unit ?? ''}` : null} />
      <BasicField label="Próxima lectura esperada" value={meter.nextReadingDue ? new Date(meter.nextReadingDue).toLocaleString() : null} />

      {meter.assignedUserNames.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>Asignado a</Text>
          {meter.assignedUserNames.map((name, i) => (
            <Text key={i} variant="bodyLarge" style={{ marginTop: 8 }}>
              {name}
            </Text>
          ))}
        </View>
      )}

      {(meter.pastDue || !meter.lastReadingDate) && (
        <Button mode="contained" onPress={() => setAddModalOpen(true)} style={{ marginTop: 24 }}>
          Agregar lectura
        </Button>
      )}
      {!meter.pastDue && meter.lastReadingDate && meter.nextReadingDue && (
        <Text variant="bodySmall" style={{ marginTop: 24, color: '#6B7280' }}>
          Todavía no toca cargar otra lectura — próxima disponible el {new Date(meter.nextReadingDue).toLocaleDateString()}.
        </Text>
      )}

      {triggers.length > 0 && (
        <Text variant="titleMedium" style={{ color: theme.colors.primary, marginTop: 32, marginBottom: 8 }}>
          Umbrales que generan órdenes
        </Text>
      )}
      {triggers.map((t) => (
        <View key={t.id} style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>{t.name}</Text>
          <Text>
            {t.condition === 'MORE_THAN' ? 'Mayor que' : 'Menor que'} {t.value} {meter.unit}
          </Text>
        </View>
      ))}

      <Text variant="titleMedium" style={{ color: theme.colors.primary, marginTop: 32, marginBottom: 8 }}>
        Historial de lecturas
      </Text>
      {[...meter.readings].reverse().map((reading) => (
        <View key={reading.id} style={styles.readingRow}>
          <View>
            <Text variant="bodySmall" style={{ color: '#6B7280' }}>
              {new Date(reading.readingDate).toLocaleString()}
            </Text>
            <Text variant="bodyLarge">
              {reading.value} {meter.unit}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {/* Mismo permiso que borrar: corregir una lectura reescribe el
                consumo historico, asi que lo hace un supervisor. */}
            {hasDeletePermission('METERS', { createdById: meter.createdById }) && (
              <IconButton
                icon="pencil"
                iconColor={theme.colors.primary}
                size={20}
                onPress={() => {
                  setEditReadingValue(String(reading.value));
                  setEditingReading(reading);
                }}
              />
            )}
            {hasDeletePermission('METERS', { createdById: meter.createdById }) && (
              <IconButton icon="delete-outline" iconColor={theme.colors.error} size={20} onPress={() => handleDeleteReading(reading.id)} />
            )}
          </View>
        </View>
      ))}

      {/* Agregar lectura */}
      <Modal visible={addModalOpen} transparent animationType="fade" onRequestClose={() => setAddModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              Agregar lectura
            </Text>
            {/* El teclado de Samsung ignora decimal-pad y numeric: muestra
                solo digitos. El boton "," inserta el separador sin depender
                del teclado del fabricante. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                mode="outlined"
                label="Lectura"
                value={readingValue}
                onChangeText={setReadingValue}
                keyboardType="numeric"
                disabled={submitting}
                style={{ flex: 1 }}
              />
              <Button
                mode="outlined"
                compact
                disabled={submitting || readingValue.includes(',') || readingValue.includes('.')}
                onPress={() => setReadingValue((v) => v + ',')}
              >
                ,
              </Button>
            </View>
            {error && <Text style={{ color: theme.colors.error, marginTop: 8 }}>{error}</Text>}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
              <Button onPress={() => setAddModalOpen(false)}>Cancelar</Button>
              <Button mode="contained" onPress={handleAddReading} loading={submitting} disabled={submitting}>
                Agregar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Editar lectura existente */}
      <Modal visible={!!editingReading} transparent animationType="fade" onRequestClose={() => setEditingReading(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              Editar lectura
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                mode="outlined"
                label="Lectura"
                value={editReadingValue}
                onChangeText={setEditReadingValue}
                keyboardType="numeric"
                disabled={submitting}
                style={{ flex: 1 }}
              />
              <Button
                mode="outlined"
                compact
                disabled={submitting || editReadingValue.includes(',') || editReadingValue.includes('.')}
                onPress={() => setEditReadingValue((v) => v + ',')}
              >
                ,
              </Button>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
              <Button onPress={() => setEditingReading(null)}>Cancelar</Button>
              <Button mode="contained" onPress={handleEditReading} loading={submitting} disabled={submitting}>
                Guardar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu de acciones del medidor (Editar/Eliminar) -- mismo patron que Ordenes de trabajo. */}
      <Modal visible={actionsMenuOpen} transparent animationType="slide" onRequestClose={() => setActionsMenuOpen(false)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setActionsMenuOpen(false)}>
          <View style={styles.sheet}>
            <TouchableOpacity style={styles.sheetItem} onPress={handleEdit}>
              <Text>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={handleDeleteMeter}>
              <Text style={{ color: theme.colors.error }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  readingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 30 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  headerImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingVertical: 8 },
  sheetItem: { paddingVertical: 16, paddingHorizontal: 20 },
});
