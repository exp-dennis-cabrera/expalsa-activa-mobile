import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, SegmentedButtons, Text, IconButton, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { requestsApi, type RequestItem } from '../../api/requests';
import type { WorkOrderPriority } from '../../api/workOrders';
import { lookupsApi, type IdName } from '../../api/lookups';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';
import ImagePickerField, { type PickedImage } from '../../components/ImagePickerField';

const PRIORITY_OPTIONS: { value: WorkOrderPriority; label: string; color: string }[] = [
  { value: 'NONE', label: 'Ninguna', color: '#9DA1A1' },
  { value: 'LOW', label: 'Baja', color: '#33C2FF' },
  { value: 'MEDIUM', label: 'Media', color: '#FFA319' },
  { value: 'HIGH', label: 'Alta', color: '#FF1943' },
];

function SelectRow({ label, value, onPress, onClear, theme }: { label: string; value: string; onPress: () => void; onClear: () => void; theme: any }) {
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
  route?: { params?: { request?: RequestItem } };
}

export default function CreateRequestScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const editingRequest = route?.params?.request;
  const isEditing = !!editingRequest;

  const [title, setTitle] = useState(editingRequest?.title ?? '');
  const [description, setDescription] = useState(editingRequest?.description ?? '');
  const [priority, setPriority] = useState<WorkOrderPriority>(editingRequest?.priority ?? 'NONE');
  const [dueDate, setDueDate] = useState<Date | null>(editingRequest?.dueDate ? new Date(editingRequest.dueDate) : null);
  const [estimatedStartDate, setEstimatedStartDate] = useState<Date | null>(
    editingRequest?.estimatedStartDate ? new Date(editingRequest.estimatedStartDate) : null,
  );
  const [estimatedDurationHours, setEstimatedDurationHours] = useState(
    editingRequest?.estimatedDurationMinutes ? String(editingRequest.estimatedDurationMinutes / 60) : '',
  );
  const [contact, setContact] = useState(editingRequest?.contact ?? '');
  const [image, setImage] = useState<PickedImage | null>(null);

  const [assets, setAssets] = useState<IdName[]>([]);
  const [locations, setLocations] = useState<IdName[]>([]);
  const [categories, setCategories] = useState<IdName[]>([]);
  const [teams, setTeams] = useState<IdName[]>([]);

  const [assetId, setAssetId] = useState<number | null>(editingRequest?.assetId ?? null);
  const [locationId, setLocationId] = useState<number | null>(editingRequest?.locationId ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(editingRequest?.categoryId ?? null);
  const [teamId, setTeamId] = useState<number | null>(editingRequest?.teamId ?? null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      lookupsApi.assets().then(setAssets).catch(() => {});
      lookupsApi.locations().then(setLocations).catch(() => {});
      lookupsApi.categories('WORK_ORDER').then(setCategories).catch(() => {});
      lookupsApi.teams().then(setTeams).catch(() => {});
    }, []),
  );

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar solicitud' : 'Nueva solicitud' });
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
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assetId: assetId ?? undefined,
        locationId: locationId ?? undefined,
        categoryId: categoryId ?? undefined,
        teamId: teamId ?? undefined,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        estimatedStartDate: estimatedStartDate ? estimatedStartDate.toISOString() : undefined,
        // Coma como separador decimal, igual que en el resto de la app.
        estimatedDurationMinutes: estimatedDurationHours
          ? Number(estimatedDurationHours.replace(',', '.')) * 60
          : undefined,
        contact: contact.trim() || undefined,
      };
      if (isEditing) {
        await requestsApi.update(editingRequest!.id, payload);
        navigation.goBack();
      } else {
        const created = await requestsApi.create(payload);
        navigation.replace('RequestDetail', { id: created.id });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? `No se pudo ${isEditing ? 'guardar' : 'crear'} la solicitud.`);
    } finally {
      setSubmitting(false);
    }
  }

  const assetName = assets.find((a) => a.id === assetId)?.name ?? '';
  const locationName = locations.find((l) => l.id === locationId)?.name ?? '';
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? '';
  const teamName = teams.find((t) => t.id === teamId)?.name ?? '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput label="Título *" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} />
      <TextInput label="Descripción" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={3} style={styles.input} />

      <ImagePickerField label="Imagen" image={image} onChange={setImage} />

      <SelectRow label="Ubicación" value={locationName} onPress={() => openSingleSelector('Ubicación', locations.map((l) => ({ id: l.id, label: l.name })), locationId, setLocationId)} onClear={() => setLocationId(null)} theme={theme} />
      <SelectRow label="Activo" value={assetName} onPress={() => openSingleSelector('Activo', assets.map((a) => ({ id: a.id, label: a.name })), assetId, setAssetId)} onClear={() => setAssetId(null)} theme={theme} />

      <CustomDateTimePicker label="Fecha de vencimiento" value={dueDate} onChange={setDueDate} />

      <CustomDateTimePicker label="Fecha de inicio prevista" value={estimatedStartDate} onChange={setEstimatedStartDate} />

      <TextInput label="Duración estimada (horas)" value={estimatedDurationHours} onChangeText={setEstimatedDurationHours} mode="outlined" keyboardType="numeric" style={styles.input} />

      <Text style={{ marginTop: 4, marginBottom: 4, color: '#6B7280' }}>Prioridad</Text>
      <SegmentedButtons
        value={priority}
        onValueChange={(v) => setPriority(v as WorkOrderPriority)}
        buttons={PRIORITY_OPTIONS.map((p) => ({ value: p.value, label: p.label, style: { backgroundColor: p.value === priority ? p.color : theme.colors.background } }))}
        style={{ marginBottom: 12 }}
      />

      <SelectRow label="Categoría" value={categoryName} onPress={() => openSingleSelector('Categoría', categories.map((c) => ({ id: c.id, label: c.name })), categoryId, setCategoryId)} onClear={() => setCategoryId(null)} theme={theme} />
      <SelectRow label="Equipo" value={teamName} onPress={() => openSingleSelector('Equipo', teams.map((t) => ({ id: t.id, label: t.name })), teamId, setTeamId)} onClear={() => setTeamId(null)} theme={theme} />

      <TextInput label="Contacto" value={contact} onChangeText={setContact} mode="outlined" style={styles.input} />

      {error && <HelperText type="error">{error}</HelperText>}

      <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={!title.trim() || submitting} style={{ marginTop: 16 }}>
        {isEditing ? 'Guardar cambios' : 'Enviar solicitud'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  input: { marginBottom: 12 },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
});
