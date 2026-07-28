import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, SegmentedButtons, Divider, Switch, Text, IconButton, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { workOrdersApi, type WorkOrderPriority, type WorkOrder } from '../../api/workOrders';
import { workOrderExtrasApi } from '../../api/workOrderExtras';
import { lookupsApi, type IdName, type UserSummary } from '../../api/lookups';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';
import ImagePickerField, { type PickedImage } from '../../components/ImagePickerField';

const PRIORITY_OPTIONS: { value: WorkOrderPriority; label: string; color: string }[] = [
  { value: 'NONE', label: 'Ninguna', color: '#9DA1A1' },
  { value: 'LOW', label: 'Baja', color: '#33C2FF' },
  { value: 'MEDIUM', label: 'Media', color: '#FFA319' },
  { value: 'HIGH', label: 'Alta', color: '#FF1943' },
];

const ASSET_STATUS_OPTIONS = [
  { value: 'OPERATIONAL', label: 'Operativo' },
  { value: 'MODERNIZATION', label: 'En modernización' },
  { value: 'DOWN', label: 'Fuera de servicio' },
  { value: 'STANDBY', label: 'En espera' },
  { value: 'INSPECTION_SCHEDULED', label: 'Inspección programada' },
  { value: 'COMMISSIONING', label: 'En puesta en marcha' },
  { value: 'EMERGENCY_SHUTDOWN', label: 'Parada de emergencia' },
];

// Fila de seleccion simple (single-select): "+" azul si vacio, o el valor
// en azul con boton rojo de quitar -- igual patron que el real.
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
  route?: { params?: { workOrder?: WorkOrder } };
}

export default function CreateWorkOrderScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const editingWorkOrder = route?.params?.workOrder;
  const isEditing = !!editingWorkOrder;

  const [title, setTitle] = useState(editingWorkOrder?.title ?? '');
  const [description, setDescription] = useState(editingWorkOrder?.description ?? '');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [priority, setPriority] = useState<WorkOrderPriority>(editingWorkOrder?.priority ?? 'NONE');
  const [dueDate, setDueDate] = useState<Date | null>(editingWorkOrder?.dueDate ? new Date(editingWorkOrder.dueDate) : null);
  const [estimatedStartDate, setEstimatedStartDate] = useState<Date | null>(
    editingWorkOrder?.estimatedStartDate ? new Date(editingWorkOrder.estimatedStartDate) : null,
  );
  const [estimatedDurationHours, setEstimatedDurationHours] = useState(
    editingWorkOrder?.estimatedDurationMinutes ? String(editingWorkOrder.estimatedDurationMinutes / 60) : '1',
  );
  const [requiresSignature, setRequiresSignature] = useState(!!editingWorkOrder?.requiresSignature);
  const [assetStatus, setAssetStatus] = useState<string | null>(null);
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  const [assets, setAssets] = useState<IdName[]>([]);
  const [locations, setLocations] = useState<IdName[]>([]);
  const [categories, setCategories] = useState<IdName[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [teams, setTeams] = useState<IdName[]>([]);

  const [assetId, setAssetId] = useState<number | null>(editingWorkOrder?.assetId ?? null);
  const [locationId, setLocationId] = useState<number | null>(editingWorkOrder?.locationId ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(editingWorkOrder?.categoryId ?? null);
  const [primaryAssigneeId, setPrimaryAssigneeId] = useState<number | null>(editingWorkOrder?.primaryAssigneeId ?? null);
  const [additionalAssigneeIds, setAdditionalAssigneeIds] = useState<number[]>(editingWorkOrder?.assignees?.map((a) => a.id) ?? []);
  const [teamId, setTeamId] = useState<number | null>(editingWorkOrder?.teamId ?? null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      lookupsApi.assets().then(setAssets).catch(() => {});
      lookupsApi.locations().then(setLocations).catch(() => {});
      lookupsApi.categories('WORK_ORDER').then(setCategories).catch(() => {});
      lookupsApi.users().then(setUsers).catch(() => {});
      lookupsApi.teams().then(setTeams).catch(() => {});
    }, []),
  );

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar orden de trabajo' : 'Nueva orden de trabajo' });
  }, [navigation, isEditing]);

  function openSingleSelector(screenTitle: string, options: { id: number; label: string }[], selectedId: number | null, setSelectedId: (id: number | null) => void) {
    navigation.navigate('SelectList', {
      title: screenTitle,
      options,
      selected: selectedId ? [selectedId] : [],
      onChange: (ids: number[]) => setSelectedId(ids.length ? ids[ids.length - 1] : null),
    });
  }

  function openMultiSelector(screenTitle: string, options: { id: number; label: string }[], selectedIds: number[], setSelectedIds: (ids: number[]) => void) {
    navigation.navigate('SelectList', { title: screenTitle, options, selected: selectedIds, onChange: setSelectedIds });
  }

  async function pickFiles() {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true, copyToCacheDirectory: true });
    if (!result.canceled && result.assets) setFiles((prev) => [...prev, ...result.assets]);
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assetId: assetId ?? undefined,
        assetStatus: assetStatus ?? undefined,
        locationId: locationId ?? undefined,
        categoryId: categoryId ?? undefined,
        dueDate: dueDate?.toISOString(),
        estimatedStartDate: estimatedStartDate?.toISOString(),
        estimatedDurationMinutes: estimatedDurationHours ? Number(estimatedDurationHours) * 60 : undefined,
        requiresSignature,
        primaryAssigneeId: primaryAssigneeId ?? undefined,
        additionalAssigneeIds: additionalAssigneeIds.length ? additionalAssigneeIds : undefined,
        teamId: teamId ?? undefined,
      };

      let workOrderId: number;
      if (isEditing) {
        await workOrdersApi.update(editingWorkOrder!.id, payload);
        workOrderId = editingWorkOrder!.id;
      } else {
        const created = await workOrdersApi.create(payload);
        workOrderId = created.id;
      }

      const allFiles = [...(image ? [image] : []), ...files];
      for (const f of allFiles) {
        await workOrderExtrasApi.uploadFile(workOrderId, { uri: f.uri, name: f.name, mimeType: f.mimeType ?? 'application/octet-stream' });
      }

      if (isEditing) navigation.goBack();
      else navigation.replace('WorkOrderDetail', { id: workOrderId });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? `No se pudo ${isEditing ? 'guardar' : 'crear'} la orden.`);
    } finally {
      setSubmitting(false);
    }
  }

  const assetName = assets.find((a) => a.id === assetId)?.name ?? '';
  const locationName = locations.find((l) => l.id === locationId)?.name ?? '';
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? '';
  const primaryUserName = users.find((u) => u.id === primaryAssigneeId)?.fullName ?? '';
  const teamName = teams.find((t) => t.id === teamId)?.name ?? '';
  const assetStatusLabel = ASSET_STATUS_OPTIONS.find((s) => s.value === assetStatus)?.label ?? '';
  const additionalWorkers = users.filter((u) => additionalAssigneeIds.includes(u.id));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput label="Título *" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} />
      <TextInput label="Descripción" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={3} style={styles.input} />

      {/* Imagen -- mismo patron que el resto, ahora con hoja Biblioteca/Camara real. */}
      <ImagePickerField label="Imagen" image={image} onChange={setImage} />

      <SelectRow label="Ubicación" value={locationName} onPress={() => openSingleSelector('Ubicación', locations.map((l) => ({ id: l.id, label: l.name })), locationId, setLocationId)} onClear={() => setLocationId(null)} theme={theme} />
      <SelectRow label="Activo" value={assetName} onPress={() => openSingleSelector('Activo', assets.map((a) => ({ id: a.id, label: a.name })), assetId, setAssetId)} onClear={() => setAssetId(null)} theme={theme} />

      <CustomDateTimePicker label="Fecha de vencimiento" value={dueDate} onChange={setDueDate} />
      <CustomDateTimePicker label="Fecha de inicio prevista" value={estimatedStartDate} onChange={setEstimatedStartDate} />

      <TextInput
        label="Duración estimada en horas"
        value={estimatedDurationHours}
        onChangeText={setEstimatedDurationHours}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
      />

      {/* Igual que PriorityPicker.tsx real: SegmentedButtons, la opcion
          elegida se rellena con su color de prioridad. */}
      <Text style={{ marginTop: 4, marginBottom: 4, color: '#6B7280' }}>Prioridad</Text>
      <SegmentedButtons
        value={priority}
        onValueChange={(v) => setPriority(v as WorkOrderPriority)}
        buttons={PRIORITY_OPTIONS.map((p) => ({
          value: p.value,
          label: p.label,
          style: { backgroundColor: p.value === priority ? p.color : theme.colors.background },
        }))}
        style={{ marginBottom: 12 }}
      />

      <SelectRow label="Categoría" value={categoryName} onPress={() => openSingleSelector('Categoría', categories.map((c) => ({ id: c.id, label: c.name })), categoryId, setCategoryId)} onClear={() => setCategoryId(null)} theme={theme} />

      <Divider style={{ marginVertical: 12 }} />

      <SelectRow label="Trabajador principal" value={primaryUserName} onPress={() => openSingleSelector('Trabajador principal', users.map((u) => ({ id: u.id, label: u.fullName || u.email })), primaryAssigneeId, setPrimaryAssigneeId)} onClear={() => setPrimaryAssigneeId(null)} theme={theme} />

      <TouchableOpacity onPress={() => openMultiSelector('Trabajadores adicionales', users.map((u) => ({ id: u.id, label: u.fullName || u.email })), additionalAssigneeIds, setAdditionalAssigneeIds)} style={styles.selectRow}>
        <Text>Trabajadores adicionales</Text>
        {additionalWorkers.length === 0 && <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} />}
      </TouchableOpacity>
      {additionalWorkers.map((u) => (
        <View key={u.id} style={styles.selectRow}>
          <Text style={{ color: theme.colors.primary }}>{u.fullName || u.email}</Text>
          <IconButton icon="close-circle" iconColor={theme.colors.error} size={20} onPress={() => setAdditionalAssigneeIds((prev) => prev.filter((id) => id !== u.id))} style={{ margin: 0 }} />
        </View>
      ))}

      <SelectRow label="Equipo" value={teamName} onPress={() => openSingleSelector('Equipo', teams.map((t) => ({ id: t.id, label: t.name })), teamId, setTeamId)} onClear={() => setTeamId(null)} theme={theme} />

      {/* Archivos -- mismo patron plus-circle. */}
      {files.map((f, index) => (
        <View key={index} style={styles.fileRow}>
          <Text variant="bodySmall" style={{ flex: 1 }} numberOfLines={1}>
            {f.name}
          </Text>
          <IconButton icon="close" size={16} onPress={() => setFiles((prev) => prev.filter((_, i) => i !== index))} />
        </View>
      ))}
      <TouchableOpacity onPress={pickFiles} style={styles.selectRow}>
        <Text>Archivos</Text>
        <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} onPress={pickFiles} style={{ margin: 0 }} />
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text>Requiere firma</Text>
        <Switch value={requiresSignature} onValueChange={setRequiresSignature} />
      </View>

      {/* Estado del activo -- al final, igual que CreateWorkOrderScreen.tsx
          real (se agrega como campo extra despues de getWorkOrderFields()). */}
      <SelectRow
        label="Estado del activo"
        value={assetStatusLabel}
        onPress={() =>
          openSingleSelector(
            'Estado del activo',
            ASSET_STATUS_OPTIONS.map((s, i) => ({ id: i, label: s.label })),
            assetStatus ? ASSET_STATUS_OPTIONS.findIndex((s) => s.value === assetStatus) : null,
            (idx) => setAssetStatus(idx === null ? null : ASSET_STATUS_OPTIONS[idx].value),
          )
        }
        onClear={() => setAssetStatus(null)}
        theme={theme}
      />

      {error && <HelperText type="error">{error}</HelperText>}

      <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={!title.trim() || submitting} style={{ marginTop: 16 }}>
        {isEditing ? 'Guardar cambios' : 'Crear orden de trabajo'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110 },
  input: { marginBottom: 12 },
  imagePreviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  imagePreview: { width: 80, height: 80, borderRadius: 8 },
  fileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, marginTop: 8 },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
});
