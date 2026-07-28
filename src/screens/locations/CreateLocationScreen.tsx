import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, Text, IconButton, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { locationsApi, type Location } from '../../api/locations';
import { lookupsApi, type IdName, type UserSummary } from '../../api/lookups';
import ImagePickerField, { type PickedImage } from '../../components/ImagePickerField';

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
  route?: { params?: { location?: Location; parentLocation?: { id: number; name: string } } };
}

export default function CreateLocationScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const editingLocation = route?.params?.location;
  const isEditing = !!editingLocation;
  const presetParentLocation = route?.params?.parentLocation;

  const [name, setName] = useState(editingLocation?.name ?? '');
  const [address, setAddress] = useState(editingLocation?.address ?? '');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);

  const [locations, setLocations] = useState<IdName[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [teams, setTeams] = useState<IdName[]>([]);
  const [vendorsList, setVendorsList] = useState<IdName[]>([]);

  const [parentLocationId, setParentLocationId] = useState<number | null>(editingLocation?.parentLocationId ?? presetParentLocation?.id ?? null);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>(editingLocation?.assignedUsers?.map((u) => u.id) ?? []);
  const [teamIds, setTeamIds] = useState<number[]>(editingLocation?.teams?.map((t) => t.id) ?? []);
  const [vendorIds, setVendorIds] = useState<number[]>(editingLocation?.vendors?.map((v) => v.id) ?? []);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      locationsApi.list(0, 100).then((r) => setLocations(r.content.filter((l) => l.id !== editingLocation?.id))).catch(() => {});
      lookupsApi.users().then(setUsers).catch(() => {});
      lookupsApi.teams().then(setTeams).catch(() => {});
      lookupsApi.vendors().then(setVendorsList).catch(() => {});
    }, []),
  );

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar ubicación' : 'Nueva ubicación' });
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
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl: string | undefined;
      let locationId: number;

      if (isEditing) {
        if (image) {
          const uploaded = await locationsApi.uploadFile(editingLocation!.id, { uri: image.uri, name: image.name, mimeType: image.mimeType });
          imageUrl = uploaded.downloadUrl;
        }
        await locationsApi.update(editingLocation!.id, {
          name: name.trim(),
          address: address.trim() || undefined,
          imageUrl: imageUrl ?? editingLocation!.imageUrl ?? undefined,
          parentLocationId: parentLocationId ?? undefined,
          assignedUserIds: assignedUserIds.length ? assignedUserIds : undefined,
          teamIds: teamIds.length ? teamIds : undefined,
          vendorIds: vendorIds.length ? vendorIds : undefined,
        });
        locationId = editingLocation!.id;
      } else {
        // La ubicacion se crea primero (sin imagen), y recien con su ID ya
        // asignado se sube la imagen y se actualiza con la URL -- mismo
        // patron en dos pasos que necesita el campo imageUrl directo.
        const created = await locationsApi.create({
          name: name.trim(),
          address: address.trim() || undefined,
          parentLocationId: parentLocationId ?? undefined,
          assignedUserIds: assignedUserIds.length ? assignedUserIds : undefined,
          teamIds: teamIds.length ? teamIds : undefined,
          vendorIds: vendorIds.length ? vendorIds : undefined,
        });
        locationId = created.id;
        if (image) {
          const uploaded = await locationsApi.uploadFile(locationId, { uri: image.uri, name: image.name, mimeType: image.mimeType });
          await locationsApi.update(locationId, { name: name.trim(), imageUrl: uploaded.downloadUrl });
        }
      }

      for (const f of files) {
        await locationsApi.uploadFile(locationId, { uri: f.uri, name: f.name, mimeType: f.mimeType ?? 'application/octet-stream' });
      }

      if (isEditing) navigation.goBack();
      else navigation.replace('LocationDetail', { id: locationId });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? `No se pudo ${isEditing ? 'guardar' : 'crear'} la ubicación.`);
    } finally {
      setSubmitting(false);
    }
  }

  const parentLocationName = locations.find((l) => l.id === parentLocationId)?.name ?? '';
  const assignedUsersList = users.filter((u) => assignedUserIds.includes(u.id));
  const assignedTeams = teams.filter((t) => teamIds.includes(t.id));
  const assignedVendors = vendorsList.filter((v) => vendorIds.includes(v.id));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput label="Nombre *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <TextInput label="Dirección" value={address} onChangeText={setAddress} mode="outlined" style={styles.input} placeholder="13th St, New York" />
      <SelectRow label="Ubicación padre" value={parentLocationName} onPress={() => openSingleSelector('Ubicación padre', locations.map((l) => ({ id: l.id, label: l.name })), parentLocationId, setParentLocationId)} onClear={() => setParentLocationId(null)} theme={theme} />

      <TouchableOpacity onPress={() => navigation.navigate('SelectList', { title: 'Trabajadores', options: users.map((u) => ({ id: u.id, label: u.fullName || u.email })), selected: assignedUserIds, onChange: setAssignedUserIds })} style={styles.selectRow}>
        <Text>Trabajadores</Text>
        {assignedUsersList.length === 0 && <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} />}
      </TouchableOpacity>
      {assignedUsersList.map((u) => (
        <View key={u.id} style={styles.selectRow}>
          <Text style={{ color: theme.colors.primary }}>{u.fullName || u.email}</Text>
          <IconButton icon="close-circle" iconColor={theme.colors.error} size={20} onPress={() => setAssignedUserIds((prev) => prev.filter((id) => id !== u.id))} style={{ margin: 0 }} />
        </View>
      ))}

      <TouchableOpacity onPress={() => navigation.navigate('SelectList', { title: 'Equipos', options: teams.map((t) => ({ id: t.id, label: t.name })), selected: teamIds, onChange: setTeamIds })} style={styles.selectRow}>
        <Text>Equipos</Text>
        {assignedTeams.length === 0 && <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} />}
      </TouchableOpacity>
      {assignedTeams.map((t) => (
        <View key={t.id} style={styles.selectRow}>
          <Text style={{ color: theme.colors.primary }}>{t.name}</Text>
          <IconButton icon="close-circle" iconColor={theme.colors.error} size={20} onPress={() => setTeamIds((prev) => prev.filter((id) => id !== t.id))} style={{ margin: 0 }} />
        </View>
      ))}

      <TouchableOpacity onPress={() => navigation.navigate('SelectList', { title: 'Proveedores', options: vendorsList.map((v) => ({ id: v.id, label: v.name })), selected: vendorIds, onChange: setVendorIds })} style={styles.selectRow}>
        <Text>Proveedores</Text>
        {assignedVendors.length === 0 && <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} />}
      </TouchableOpacity>
      {assignedVendors.map((v) => (
        <View key={v.id} style={styles.selectRow}>
          <Text style={{ color: theme.colors.primary }}>{v.name}</Text>
          <IconButton icon="close-circle" iconColor={theme.colors.error} size={20} onPress={() => setVendorIds((prev) => prev.filter((id) => id !== v.id))} style={{ margin: 0 }} />
        </View>
      ))}

      <ImagePickerField label="Imagen" image={image} existingImageUrl={editingLocation?.imageUrl} onChange={setImage} />

      {files.map((f, index) => (
        <View key={index} style={styles.selectRow}>
          <Text variant="bodySmall" style={{ flex: 1 }} numberOfLines={1}>
            {f.name}
          </Text>
          <IconButton icon="close" size={16} onPress={() => setFiles((prev) => prev.filter((_, i) => i !== index))} />
        </View>
      ))}
      <TouchableOpacity
        onPress={async () => {
          const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true, copyToCacheDirectory: true });
          if (!result.canceled && result.assets) setFiles((prev) => [...prev, ...result.assets]);
        }}
        style={styles.selectRow}
      >
        <Text>Archivos</Text>
        <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} />
      </TouchableOpacity>

      {error && <HelperText type="error">{error}</HelperText>}

      <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={!name.trim() || submitting} style={{ marginTop: 16 }}>
        {isEditing ? 'Guardar cambios' : 'Crear ubicación'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  input: { marginBottom: 12 },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
});
