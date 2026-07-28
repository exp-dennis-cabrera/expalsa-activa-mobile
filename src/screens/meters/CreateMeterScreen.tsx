import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, Text, IconButton, useTheme } from 'react-native-paper';
import ImagePickerField, { type PickedImage } from '../../components/ImagePickerField';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { metersApi, type Meter } from '../../api/meters';
import { lookupsApi, type IdName, type UserSummary } from '../../api/lookups';

function SelectRow({
  label,
  value,
  onPress,
  onClear,
  theme,
}: {
  label: string;
  value: string;
  onPress: () => void;
  onClear: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.selectRow}>
      <Text>{label}</Text>
      {!value && <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} onPress={onPress} />}
      {!!value && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.primary }}>{value}</Text>
          <IconButton icon="close-circle" iconColor={theme.colors.error} size={20} onPress={onClear} style={{ margin: 0 }} />
        </View>
      )}
    </TouchableOpacity>
  );
}

interface Props {
  navigation: any;
  route?: { params?: { meter?: Meter } };
}

// Misma pantalla sirve para crear y editar -- igual patron que
// CreateMeterScreen.tsx / EditMeterScreen.tsx reales, que reutilizan el
// mismo formulario (getMeterFields), solo cambia si hay un "meter" previo.
export default function CreateMeterScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const editingMeter = route?.params?.meter;
  const isEditing = !!editingMeter;

  const [name, setName] = useState(editingMeter?.name ?? '');
  const [unit, setUnit] = useState(editingMeter?.unit ?? '');
  const [updateFrequencyDays, setUpdateFrequencyDays] = useState(editingMeter ? String(editingMeter.updateFrequencyDays) : '1');
  const [image, setImage] = useState<PickedImage | null>(null);

  const [assets, setAssets] = useState<IdName[]>([]);
  const [locations, setLocations] = useState<IdName[]>([]);
  const [categories, setCategories] = useState<IdName[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);

  const [assetId, setAssetId] = useState<number | null>(editingMeter?.assetId ?? null);
  const [locationId, setLocationId] = useState<number | null>(editingMeter?.locationId ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(editingMeter?.categoryId ?? null);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>(editingMeter?.assignedUserIds ?? []);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setLoadError(null);
      lookupsApi.assets().then(setAssets).catch((err) => setLoadError('Error cargando Activos: ' + (err?.response?.status ?? err?.message ?? 'desconocido')));
      lookupsApi.locations().then(setLocations).catch(() => {});
      lookupsApi.categories('METER').then(setCategories).catch(() => {});
      lookupsApi.users().then(setUsers).catch(() => {});
    }, []),
  );

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar medidor' : 'Nuevo medidor' });
  }, [navigation, isEditing]);

  function openSingleSelector(title: string, options: { id: number; label: string }[], selectedId: number | null, setSelectedId: (id: number | null) => void) {
    navigation.navigate('SelectList', {
      title,
      options,
      selected: selectedId ? [selectedId] : [],
      onChange: (ids: number[]) => setSelectedId(ids.length ? ids[ids.length - 1] : null),
    });
  }

  async function handleSubmit() {
    if (!name.trim() || !assetId) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        unit: unit.trim() || undefined,
        updateFrequencyDays: Number(updateFrequencyDays) || 1,
        categoryId: categoryId ?? undefined,
        locationId: locationId ?? undefined,
        assignedUserIds: assignedUserIds.length ? assignedUserIds : undefined,
      };

      let meterId: number;
      if (isEditing) {
        await metersApi.update(editingMeter!.id, payload);
        meterId = editingMeter!.id;
      } else {
        const created = await metersApi.create(assetId, payload);
        meterId = created.id;
      }

      if (image) {
        await metersApi.uploadImage(meterId, { uri: image.uri, name: image.name, mimeType: image.mimeType ?? 'image/jpeg' });
      }

      if (isEditing) navigation.goBack();
      else navigation.replace('MeterDetail', { id: meterId });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? `No se pudo ${isEditing ? 'guardar' : 'crear'} el medidor.`);
    } finally {
      setSubmitting(false);
    }
  }

  const assetName = assets.find((a) => a.id === assetId)?.name ?? '';
  const locationName = locations.find((l) => l.id === locationId)?.name ?? '';
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? '';
  const assignedUsers = users.filter((u) => assignedUserIds.includes(u.id));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput label="Nombre *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <TextInput label="Unidad (ej. litros, °C, PSI)" value={unit} onChangeText={setUnit} mode="outlined" style={styles.input} />

      <ImagePickerField label="Imagen" image={image} existingImageUrl={editingMeter?.imageUrl} onChange={setImage} />

      <SelectRow label="Ubicación" value={locationName} onPress={() => openSingleSelector('Ubicación', locations.map((l) => ({ id: l.id, label: l.name })), locationId, setLocationId)} onClear={() => setLocationId(null)} theme={theme} />
      <SelectRow label="Activo *" value={assetName} onPress={() => openSingleSelector('Activo', assets.map((a) => ({ id: a.id, label: a.name })), assetId, setAssetId)} onClear={() => setAssetId(null)} theme={theme} />
      <Text variant="bodySmall" style={{ color: '#6B7280', marginTop: -8, marginBottom: 12 }}>
        Activos disponibles: {assets.length}
      </Text>
      {loadError && (
        <Text variant="bodySmall" style={{ color: theme.colors.error, marginBottom: 12 }}>
          {loadError}
        </Text>
      )}

      <TextInput
        label="Frecuencia de lectura (días) *"
        value={updateFrequencyDays}
        onChangeText={setUpdateFrequencyDays}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      <SelectRow label="Categoría" value={categoryName} onPress={() => openSingleSelector('Categoría', categories.map((c) => ({ id: c.id, label: c.name })), categoryId, setCategoryId)} onClear={() => setCategoryId(null)} theme={theme} />

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('SelectList', {
            title: 'Trabajadores a notificar',
            options: users.map((u) => ({ id: u.id, label: u.fullName || u.email })),
            selected: assignedUserIds,
            onChange: setAssignedUserIds,
          })
        }
        style={styles.selectRow}
      >
        <Text>Trabajadores a notificar</Text>
        {assignedUsers.length === 0 && <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} />}
      </TouchableOpacity>
      {assignedUsers.map((u) => (
        <View key={u.id} style={styles.selectRow}>
          <Text style={{ color: theme.colors.primary }}>{u.fullName || u.email}</Text>
          <IconButton icon="close-circle" iconColor={theme.colors.error} size={20} onPress={() => setAssignedUserIds((prev) => prev.filter((id) => id !== u.id))} style={{ margin: 0 }} />
        </View>
      ))}

      {error && <HelperText type="error">{error}</HelperText>}

      <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={!name.trim() || !assetId || submitting} style={{ marginTop: 16 }}>
        {isEditing ? 'Guardar cambios' : 'Crear medidor'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  input: { marginBottom: 12 },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  imagePreviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  imagePreview: { width: 80, height: 80, borderRadius: 8 },
});
