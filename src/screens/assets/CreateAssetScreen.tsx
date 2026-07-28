import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, Text, IconButton, Divider, Menu, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { assetsApi, type Asset, type AssetStatus } from '../../api/assets';
import { lookupsApi, type IdName, type UserSummary } from '../../api/lookups';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';
import ImagePickerField, { type PickedImage } from '../../components/ImagePickerField';

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: 'OPERATIONAL', label: 'Operativo' },
  { value: 'MODERNIZATION', label: 'En modernización' },
  { value: 'DOWN', label: 'Fuera de servicio' },
  { value: 'STANDBY', label: 'En espera' },
  { value: 'INSPECTION_SCHEDULED', label: 'Inspección programada' },
  { value: 'COMMISSIONING', label: 'En puesta en marcha' },
  { value: 'EMERGENCY_SHUTDOWN', label: 'Parada de emergencia' },
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
  route?: {
    params?: {
      asset?: Asset;
      parentAsset?: { id: number; name: string };
      location?: { id: number; name: string };
      presetIdentifier?: { barCode?: string; nfcId?: string };
    };
  };
}

export default function CreateAssetScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const editingAsset = route?.params?.asset;
  const isEditing = !!editingAsset;
  const presetParentAsset = route?.params?.parentAsset;
  const presetLocation = route?.params?.location;
  const presetIdentifier = route?.params?.presetIdentifier;

  const [name, setName] = useState(editingAsset?.name ?? '');
  const [description, setDescription] = useState(editingAsset?.description ?? '');
  const [status, setStatus] = useState<AssetStatus>(editingAsset?.status ?? 'OPERATIONAL');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [model, setModel] = useState(editingAsset?.model ?? '');
  const [serialNumber, setSerialNumber] = useState(editingAsset?.serialNumber ?? '');
  const [manufacturer, setManufacturer] = useState(editingAsset?.manufacturer ?? '');
  const [power, setPower] = useState(editingAsset?.power ?? '');
  const [area, setArea] = useState(editingAsset?.area ?? '');
  const [barCode, setBarCode] = useState(editingAsset?.barCode ?? presetIdentifier?.barCode ?? '');
  const [nfcId, setNfcId] = useState(editingAsset?.nfcId ?? presetIdentifier?.nfcId ?? '');
  const [acquisitionCost, setAcquisitionCost] = useState(editingAsset?.acquisitionCost ? String(editingAsset.acquisitionCost) : '');
  const [additionalInfos, setAdditionalInfos] = useState(editingAsset?.additionalInfos ?? '');
  const [inServiceDate, setInServiceDate] = useState<Date | null>(editingAsset?.inServiceDate ? new Date(editingAsset.inServiceDate) : null);
  const [warrantyExpirationDate, setWarrantyExpirationDate] = useState<Date | null>(
    editingAsset?.warrantyExpirationDate ? new Date(editingAsset.warrantyExpirationDate) : null,
  );
  const [image, setImage] = useState<PickedImage | null>(null);

  const [locations, setLocations] = useState<IdName[]>([]);
  const [categories, setCategories] = useState<IdName[]>([]);
  const [assets, setAssets] = useState<IdName[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [teams, setTeams] = useState<IdName[]>([]);

  const [locationId, setLocationId] = useState<number | null>(editingAsset?.locationId ?? presetLocation?.id ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(editingAsset?.categoryId ?? null);
  const [parentAssetId, setParentAssetId] = useState<number | null>(editingAsset?.parentAssetId ?? presetParentAsset?.id ?? null);
  const [primaryUserId, setPrimaryUserId] = useState<number | null>(editingAsset?.primaryUserId ?? null);
  const [teamIds, setTeamIds] = useState<number[]>(editingAsset?.teams?.map((t) => t.id) ?? []);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>(editingAsset?.assignedUsers?.map((u) => u.id) ?? []);
  const [vendorIds, setVendorIds] = useState<number[]>(editingAsset?.vendors?.map((v) => v.id) ?? []);
  const [partIds, setPartIds] = useState<number[]>(editingAsset?.parts?.map((p) => p.id) ?? []);
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [vendorsList, setVendorsList] = useState<IdName[]>([]);
  const [partsList, setPartsList] = useState<IdName[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      lookupsApi.locations().then(setLocations).catch(() => {});
      lookupsApi.categories('ASSET').then(setCategories).catch(() => {});
      lookupsApi.assets().then(setAssets).catch(() => {});
      lookupsApi.users().then(setUsers).catch(() => {});
      lookupsApi.teams().then(setTeams).catch(() => {});
      lookupsApi.vendors().then(setVendorsList).catch(() => {});
      lookupsApi.parts().then(setPartsList).catch(() => {});
    }, []),
  );

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar activo' : 'Nuevo activo' });
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
    if (!name.trim() || !locationId) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        categoryId: categoryId ?? undefined,
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        power: power.trim() || undefined,
        area: area.trim() || undefined,
        barCode: barCode.trim() || undefined,
        nfcId: nfcId.trim() || undefined,
        acquisitionCost: acquisitionCost ? Number(acquisitionCost) : undefined,
        additionalInfos: additionalInfos.trim() || undefined,
        inServiceDate: inServiceDate ? inServiceDate.toISOString().slice(0, 10) : undefined,
        warrantyExpirationDate: warrantyExpirationDate ? warrantyExpirationDate.toISOString().slice(0, 10) : undefined,
        locationId: locationId ?? undefined,
        parentAssetId: parentAssetId ?? undefined,
        primaryUserId: primaryUserId ?? undefined,
        assignedUserIds: assignedUserIds.length ? assignedUserIds : undefined,
        teamIds: teamIds.length ? teamIds : undefined,
        vendorIds: vendorIds.length ? vendorIds : undefined,
        partIds: partIds.length ? partIds : undefined,
      };

      let assetId: number;
      if (isEditing) {
        await assetsApi.update(editingAsset!.id, payload);
        assetId = editingAsset!.id;
      } else {
        const created = await assetsApi.create(payload);
        assetId = created.id;
      }

      const allFiles = [...(image ? [image] : []), ...files];
      for (const f of allFiles) {
        await assetsApi.uploadImage(assetId, { uri: f.uri, name: f.name, mimeType: f.mimeType ?? 'application/octet-stream' });
      }

      if (isEditing) navigation.goBack();
      else navigation.replace('AssetDetail', { id: assetId });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? `No se pudo ${isEditing ? 'guardar' : 'crear'} el activo.`);
    } finally {
      setSubmitting(false);
    }
  }

  const locationName = locations.find((l) => l.id === locationId)?.name ?? '';
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? '';
  const parentAssetName = assets.find((a) => a.id === parentAssetId)?.name ?? '';
  const primaryUserName = users.find((u) => u.id === primaryUserId)?.fullName ?? '';
  const assignedTeams = teams.filter((t) => teamIds.includes(t.id));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleSmall" style={styles.groupTitle}>
        Información del activo
      </Text>
      <TextInput label="Nombre *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <SelectRow label="Ubicación *" value={locationName} onPress={() => openSingleSelector('Ubicación', locations.map((l) => ({ id: l.id, label: l.name })), locationId, setLocationId)} onClear={() => setLocationId(null)} theme={theme} />
      <TextInput label="Costo de adquisición" value={acquisitionCost} onChangeText={setAcquisitionCost} mode="outlined" keyboardType="numeric" style={styles.input} />
      <TextInput label="Descripción" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={3} style={styles.input} />
      <TextInput label="Fabricante" value={manufacturer} onChangeText={setManufacturer} mode="outlined" style={styles.input} />
      <TextInput label="Potencia" value={power} onChangeText={setPower} mode="outlined" style={styles.input} />
      <TextInput label="Modelo" value={model} onChangeText={setModel} mode="outlined" style={styles.input} />
      <TextInput label="Número de serie" value={serialNumber} onChangeText={setSerialNumber} mode="outlined" style={styles.input} />
      <TextInput label="Código de barras" value={barCode} onChangeText={setBarCode} mode="outlined" style={styles.input} />
      <TextInput label="Etiqueta NFC" value={nfcId} onChangeText={setNfcId} mode="outlined" style={styles.input} />
      <SelectRow label="Categoría" value={categoryName} onPress={() => openSingleSelector('Categoría', categories.map((c) => ({ id: c.id, label: c.name })), categoryId, setCategoryId)} onClear={() => setCategoryId(null)} theme={theme} />
      <TextInput label="Área" value={area} onChangeText={setArea} mode="outlined" style={styles.input} />

      <Menu
        visible={statusMenuOpen}
        onDismiss={() => setStatusMenuOpen(false)}
        anchor={
          <TextInput
            label="Estado"
            value={STATUS_OPTIONS.find((s) => s.value === status)?.label ?? ''}
            onPressIn={() => setStatusMenuOpen(true)}
            showSoftInputOnFocus={false}
            mode="outlined"
            style={styles.input}
            right={<TextInput.Icon icon="chevron-down" onPress={() => setStatusMenuOpen(true)} />}
          />
        }
      >
        {STATUS_OPTIONS.map((s) => (
          <Menu.Item key={s.value} title={s.label} onPress={() => { setStatus(s.value); setStatusMenuOpen(false); }} />
        ))}
      </Menu>

      <ImagePickerField label="Imagen" image={image} existingImageUrl={editingAsset?.imageUrl} onChange={setImage} />

      <Divider style={{ marginVertical: 12 }} />
      <Text variant="titleSmall" style={styles.groupTitle}>
        Asignado a
      </Text>
      <SelectRow label="Trabajador principal" value={primaryUserName} onPress={() => openSingleSelector('Trabajador principal', users.map((u) => ({ id: u.id, label: u.fullName || u.email })), primaryUserId, setPrimaryUserId)} onClear={() => setPrimaryUserId(null)} theme={theme} />

      <TouchableOpacity
        onPress={() => navigation.navigate('SelectList', { title: 'Trabajadores adicionales', options: users.map((u) => ({ id: u.id, label: u.fullName || u.email })), selected: assignedUserIds, onChange: setAssignedUserIds })}
        style={styles.selectRow}
      >
        <Text>Trabajadores adicionales</Text>
        {assignedUserIds.length === 0 && <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} />}
      </TouchableOpacity>
      {users.filter((u) => assignedUserIds.includes(u.id)).map((u) => (
        <View key={u.id} style={styles.selectRow}>
          <Text style={{ color: theme.colors.primary }}>{u.fullName || u.email}</Text>
          <IconButton icon="close-circle" iconColor={theme.colors.error} size={20} onPress={() => setAssignedUserIds((prev) => prev.filter((uid) => uid !== u.id))} style={{ margin: 0 }} />
        </View>
      ))}
      <TouchableOpacity
        onPress={() => navigation.navigate('SelectList', { title: 'Equipos', options: teams.map((t) => ({ id: t.id, label: t.name })), selected: teamIds, onChange: setTeamIds })}
        style={styles.selectRow}
      >
        <Text>Equipos</Text>
        {assignedTeams.length === 0 && <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} />}
      </TouchableOpacity>
      {assignedTeams.map((t) => (
        <View key={t.id} style={styles.selectRow}>
          <Text style={{ color: theme.colors.primary }}>{t.name}</Text>
          <IconButton icon="close-circle" iconColor={theme.colors.error} size={20} onPress={() => setTeamIds((prev) => prev.filter((id) => id !== t.id))} style={{ margin: 0 }} />
        </View>
      ))}

      <Divider style={{ marginVertical: 12 }} />
      <Text variant="titleSmall" style={styles.groupTitle}>
        Más información
      </Text>
      <CustomDateTimePicker label="Puesta en servicio" value={inServiceDate} onChange={setInServiceDate} />
      <CustomDateTimePicker label="Vencimiento de garantía" value={warrantyExpirationDate} onChange={setWarrantyExpirationDate} />
      <TextInput label="Información adicional" value={additionalInfos} onChangeText={setAdditionalInfos} mode="outlined" multiline numberOfLines={3} style={styles.input} />

      <TouchableOpacity
        onPress={() => navigation.navigate('SelectList', { title: 'Proveedores', options: vendorsList.map((v) => ({ id: v.id, label: v.name })), selected: vendorIds, onChange: setVendorIds })}
        style={styles.selectRow}
      >
        <Text>Proveedores</Text>
        {vendorIds.length === 0 && <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} />}
      </TouchableOpacity>
      {vendorsList.filter((v) => vendorIds.includes(v.id)).map((v) => (
        <View key={v.id} style={styles.selectRow}>
          <Text style={{ color: theme.colors.primary }}>{v.name}</Text>
          <IconButton icon="close-circle" iconColor={theme.colors.error} size={20} onPress={() => setVendorIds((prev) => prev.filter((id) => id !== v.id))} style={{ margin: 0 }} />
        </View>
      ))}

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

      <Divider style={{ marginVertical: 12 }} />
      <Text variant="titleSmall" style={styles.groupTitle}>
        Estructura
      </Text>
      <SelectRow label="Activo padre" value={parentAssetName} onPress={() => openSingleSelector('Activo padre', assets.filter((a) => a.id !== editingAsset?.id).map((a) => ({ id: a.id, label: a.name })), parentAssetId, setParentAssetId)} onClear={() => setParentAssetId(null)} theme={theme} />

      <TouchableOpacity
        onPress={() => navigation.navigate('SelectList', { title: 'Repuestos', options: partsList.map((p) => ({ id: p.id, label: p.name })), selected: partIds, onChange: setPartIds })}
        style={styles.selectRow}
      >
        <Text>Repuestos</Text>
        {partIds.length === 0 && <IconButton icon="plus-circle" iconColor={theme.colors.primary} size={22} style={{ margin: 0 }} />}
      </TouchableOpacity>
      {partsList.filter((p) => partIds.includes(p.id)).map((p) => (
        <View key={p.id} style={styles.selectRow}>
          <Text style={{ color: theme.colors.primary }}>{p.name}</Text>
          <IconButton icon="close-circle" iconColor={theme.colors.error} size={20} onPress={() => setPartIds((prev) => prev.filter((id) => id !== p.id))} style={{ margin: 0 }} />
        </View>
      ))}

      {error && <HelperText type="error">{error}</HelperText>}

      <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={!name.trim() || !locationId || submitting} style={{ marginTop: 16 }}>
        {isEditing ? 'Guardar cambios' : 'Crear activo'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  input: { marginBottom: 12 },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  groupTitle: { marginBottom: 8, fontWeight: 'bold' },
  imagePreviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  imagePreview: { width: 80, height: 80, borderRadius: 8 },
});
