import { useCallback, useLayoutEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Modal, TouchableOpacity } from 'react-native';
import { Text, IconButton, useTheme, ActivityIndicator, TextInput, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { requestsApi, type RequestItem } from '../../api/requests';
import { useAuth } from '../../context/AuthContext';

const PRIORITY_LABELS: Record<string, string> = { NONE: 'Ninguna', LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' };

function statusMeta(request: RequestItem, theme: any): [string, string] {
  if (request.workOrderId) return ['Aprobada', theme.colors.success];
  if (request.cancelled) return ['Rechazada', theme.colors.error];
  return ['Pendiente', theme.colors.primary];
}

function BasicField({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.fieldRow}>
      <Text>{label}</Text>
      <Text style={{ fontWeight: 'bold' }}>{value}</Text>
    </View>
  );
}

function ObjectField({ label, value, theme, onPress }: { label: string; value: string | null | undefined; theme: any; onPress?: () => void }) {
  if (!value) return null;
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.objectField}>
      <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={{ color: onPress ? theme.colors.primary : undefined }}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

export default function RequestDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const theme = useTheme();
  const { hasEditPermission, hasDeletePermission, hasViewPermission } = useAuth();
  const [request, setRequest] = useState<RequestItem | null>(null);
  const [approving, setApproving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    requestsApi.getById(id).then(setRequest).catch(() => {});
  }, [id]);

  useFocusEffect(load);

  async function handleApprove() {
    setApproving(true);
    try {
      const result = await requestsApi.approve(id);
      navigation.navigate('WorkOrderDetail', { id: result.id });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'No se pudo aprobar la solicitud.');
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!feedback.trim()) return;
    setCancelling(true);
    try {
      await requestsApi.cancel(id, feedback.trim());
      setRejectOpen(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'No se pudo rechazar la solicitud.');
    } finally {
      setCancelling(false);
    }
  }

  async function handleDelete() {
    try {
      await requestsApi.delete(id);
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'No se pudo eliminar la solicitud.');
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: request?.title ?? 'Cargando…',
      headerRight: () =>
        request && (
          <View style={{ flexDirection: 'row' }}>
            {hasDeletePermission('REQUESTS', { createdById: request.createdById }) && (
              <IconButton icon="delete-outline" onPress={() => setDeleteOpen(true)} />
            )}
            {!request.workOrderId && !request.cancelled && hasEditPermission('REQUESTS', { createdById: request.createdById }) && (
              <IconButton icon="pencil" onPress={() => navigation.navigate('AddRequest', { request })} />
            )}
            {!request.workOrderId &&
              !request.cancelled &&
              hasViewPermission('SETTINGS') &&
              (approving ? <ActivityIndicator style={{ margin: 10 }} /> : <IconButton icon="check" onPress={handleApprove} />)}
          </View>
        ),
    });
  }, [navigation, request, approving]);

  if (!request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const [statusLabel] = statusMeta(request, theme);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BasicField label="Descripción" value={request.description} />
      <BasicField label="Estado" value={statusLabel} />
      <BasicField label="ID" value={request.id} />
      <BasicField label="Prioridad" value={PRIORITY_LABELS[request.priority]} />
      <BasicField label="Fecha de vencimiento" value={request.dueDate ? new Date(request.dueDate).toLocaleDateString() : null} />
      <BasicField
        label="Fecha de inicio prevista"
        value={request.estimatedStartDate ? new Date(request.estimatedStartDate).toLocaleDateString() : null}
      />
      <BasicField label="Categoría" value={request.categoryName} />

      <ObjectField label="Solicitado por" value={request.createdByName} theme={theme} />
      <ObjectField label="Activo" value={request.assetName} theme={theme} onPress={request.assetId ? () => navigation.navigate('AssetDetail', { id: request.assetId }) : undefined} />
      <ObjectField label="Ubicación" value={request.locationName} theme={theme} onPress={request.locationId ? () => navigation.navigate('LocationDetail', { id: request.locationId }) : undefined} />
      <ObjectField label="Equipo" value={request.teamName} theme={theme} />

      {request.cancelled && request.cancellationReason && (
        <View style={{ backgroundColor: '#fff', padding: 20, marginTop: 8 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Motivo del rechazo</Text>
          <Text>{request.cancellationReason}</Text>
        </View>
      )}

      {error && (
        <Text style={{ color: theme.colors.error, padding: 20 }}>{error}</Text>
      )}

      {!request.workOrderId && !request.cancelled && hasViewPermission('SETTINGS') && (
        <Button disabled={cancelling} loading={cancelling} onPress={() => setRejectOpen(true)} mode="contained" style={{ margin: 20 }} buttonColor={theme.colors.error}>
          Rechazar
        </Button>
      )}

      <Modal visible={rejectOpen} transparent animationType="fade" onRequestClose={() => setRejectOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              Rechazar solicitud
            </Text>
            <TextInput mode="outlined" label="Motivo" multiline value={feedback} onChangeText={setFeedback} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
              <Button onPress={() => setRejectOpen(false)}>Cancelar</Button>
              <Button mode="contained" onPress={handleReject} loading={cancelling} disabled={!feedback.trim() || cancelling}>
                Rechazar
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              ¿Eliminar esta solicitud?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button onPress={() => setDeleteOpen(false)}>Cancelar</Button>
              <Button
                mode="contained"
                buttonColor={theme.colors.error}
                onPress={() => {
                  setDeleteOpen(false);
                  handleDelete();
                }}
              >
                Eliminar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  objectField: { marginTop: 20, padding: 20, backgroundColor: 'white' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 30 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
});
