import { useCallback, useLayoutEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Modal, Alert, useWindowDimensions } from 'react-native';
import { Text, IconButton, useTheme, ActivityIndicator, Chip } from 'react-native-paper';
import { TabBar, TabView } from 'react-native-tab-view';
import { useFocusEffect } from '@react-navigation/native';
import { assetsApi, type Asset } from '../../api/assets';
import { getApiClient } from '../../api/client';

const STATUS_LABELS: Record<string, string> = {
  OPERATIONAL: 'Operativo',
  MODERNIZATION: 'En modernización',
  DOWN: 'Fuera de servicio',
  STANDBY: 'En espera',
  INSPECTION_SCHEDULED: 'Inspección programada',
  COMMISSIONING: 'En puesta en marcha',
  EMERGENCY_SHUTDOWN: 'Parada de emergencia',
};

const WO_STATUS_LABELS: Record<string, string> = { OPEN: 'Abierta', IN_PROGRESS: 'En progreso', ON_HOLD: 'En espera', COMPLETED: 'Completada' };
function woStatusColor(status: string, theme: any): string {
  switch (status) {
    case 'OPEN':
      return theme.colors.tertiary;
    case 'IN_PROGRESS':
      return theme.colors.success;
    case 'ON_HOLD':
      return theme.colors.warning;
    case 'COMPLETED':
      return 'black';
    default:
      return theme.colors.grey;
  }
}

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

function ObjectField({ label, value, theme }: { label: string; value: string | null | undefined; theme: any }) {
  if (!value) return null;
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 14, color: '#6B7280' }}>{label}</Text>
      <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
        {value}
      </Text>
    </View>
  );
}

function ListField({ label, values }: { label: string; values: { id: number; name: string }[] }) {
  if (!values || values.length === 0) return null;
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ fontSize: 14, color: '#6B7280' }}>{label}</Text>
      {values.map((v) => (
        <Text key={v.id} variant="bodyLarge" style={{ marginTop: 8 }}>
          {v.name}
        </Text>
      ))}
    </View>
  );
}

// --- Escena: Detalles -- igual que AssetDetails.tsx real ---
function DetailsScene({ asset, theme }: { asset: Asset; theme: any }) {
  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {asset.imageUrl && <Image source={{ uri: asset.imageUrl }} style={styles.headerImage} />}
      <BasicField label="Nombre" value={asset.name} />
      <BasicField label="Descripción" value={asset.description} />
      <BasicField label="Categoría" value={asset.categoryName} />
      <BasicField label="Modelo" value={asset.model} />
      <BasicField label="Número de serie" value={asset.serialNumber} />
      <BasicField label="Estado" value={STATUS_LABELS[asset.status]} />
      <BasicField label="Costo de adquisición" value={asset.acquisitionCost ? `$${asset.acquisitionCost}` : null} />
      <BasicField label="Área" value={asset.area} />
      <BasicField label="Código de barras" value={asset.barCode} />
      <BasicField label="Etiqueta NFC" value={asset.nfcId} />
      <BasicField label="Información adicional" value={asset.additionalInfos} />
      <BasicField label="Puesta en servicio" value={asset.inServiceDate} />
      <BasicField label="Vencimiento de garantía" value={asset.warrantyExpirationDate} />

      <ObjectField label="Trabajador principal" value={asset.primaryUserName} theme={theme} />
      <ObjectField label="Ubicación" value={asset.locationName} theme={theme} />
      <ObjectField label="Activo padre" value={asset.parentAssetName} theme={theme} />

      <ListField label="Asignado a" values={asset.assignedUsers} />
      <ListField label="Proveedores" values={asset.vendors} />
      <ListField label="Equipos" values={asset.teams} />
    </ScrollView>
  );
}

// --- Escena: Órdenes de trabajo -- igual que AssetWorkOrders.tsx real ---
function WorkOrdersScene({ assetId, navigation, theme }: { assetId: number; navigation: any; theme: any }) {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  useFocusEffect(
    useCallback(() => {
      getApiClient().then((client) => client.get(`/assets/${assetId}/work-orders`)).then((r) => setWorkOrders(r.data)).catch(() => {});
    }, [assetId]),
  );
  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 12, paddingBottom: 60 }}>
      {workOrders.length === 0 ? (
        <Text style={{ padding: 20 }}>Sin órdenes de trabajo para este activo.</Text>
      ) : (
        workOrders.map((wo: any) => (
          <TouchableOpacity key={wo.id} onPress={() => navigation.navigate('WorkOrderDetail', { id: wo.id })}>
            <View style={[styles.rowCard, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={{ fontWeight: 'bold', flexShrink: 1, marginRight: 10 }}>{wo.title}</Text>
              <Chip compact style={{ backgroundColor: woStatusColor(wo.status, theme) }} textStyle={{ color: 'white', fontSize: 11 }}>
                {WO_STATUS_LABELS[wo.status] ?? wo.status}
              </Chip>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// --- Escena: Archivos -- igual que AssetFiles.tsx real ---
function FilesScene({ assetId, theme }: { assetId: number; theme: any }) {
  const [files, setFiles] = useState<any[]>([]);
  useFocusEffect(
    useCallback(() => {
      getApiClient().then((client) => client.get(`/assets/${assetId}/files`)).then((r) => setFiles(r.data)).catch(() => {});
    }, [assetId]),
  );
  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 12, paddingBottom: 60 }}>
      {files.length === 0 ? (
        <Text style={{ padding: 20 }}>Sin archivos adjuntos.</Text>
      ) : (
        files.map((f: any) => (
          <View key={f.id} style={styles.rowCard}>
            <Text>{f.fileName}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// --- Escena: Repuestos -- igual que AssetParts.tsx real ---
function PartsScene({ asset, theme }: { asset: Asset; theme: any }) {
  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 12, paddingBottom: 60 }}>
      {asset.parts.length === 0 ? (
        <Text style={{ padding: 20 }}>Sin repuestos vinculados.</Text>
      ) : (
        asset.parts.map((p) => (
          <View key={p.id} style={styles.rowCard}>
            <Text>{p.name}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

export default function AssetDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const theme = useTheme();
  const layout = useWindowDimensions();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [tabs] = useState([
    { key: 'details', title: 'Detalles' },
    { key: 'work-orders', title: 'Órdenes de trabajo' },
    { key: 'files', title: 'Archivos' },
    { key: 'parts', title: 'Repuestos' },
  ]);

  const load = useCallback(() => {
    assetsApi.getById(id).then(setAsset).catch(() => {});
  }, [id]);

  useFocusEffect(load);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: asset?.name ?? 'Cargando…',
      headerRight: () => (asset ? <IconButton icon="dots-vertical" onPress={() => setActionsMenuOpen(true)} /> : null),
    });
  }, [navigation, asset]);

  function handleEdit() {
    setActionsMenuOpen(false);
    navigation.navigate('AddAsset', { asset });
  }

  function handleDelete() {
    setActionsMenuOpen(false);
    Alert.alert('Eliminar activo', 'Esta acción no se puede deshacer. ¿Eliminar este activo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await assetsApi.delete(id);
          navigation.goBack();
        },
      },
    ]);
  }

  function handleCreateWorkOrder() {
    setActionsMenuOpen(false);
    navigation.navigate('AddWorkOrder', { presetAsset: asset });
  }

  function handleCreateChildAsset() {
    setActionsMenuOpen(false);
    navigation.navigate('AddAsset', { parentAsset: asset });
  }

  if (!asset) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  // Igual que renderScene() real.
  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'details':
        return <DetailsScene asset={asset} theme={theme} />;
      case 'work-orders':
        return <WorkOrdersScene assetId={id} navigation={navigation} theme={theme} />;
      case 'files':
        return <FilesScene assetId={id} theme={theme} />;
      case 'parts':
        return <PartsScene asset={asset} theme={theme} />;
      default:
        return null;
    }
  };

  // Igual que renderTabBar() real: indicador blanco sobre fondo primario.
  const renderTabBar = (props: any) => (
    <TabBar {...props} scrollEnabled indicatorStyle={{ backgroundColor: 'white' }} style={{ backgroundColor: theme.colors.primary }} />
  );

  return (
    <View style={{ flex: 1 }}>
      <TabView
        renderTabBar={renderTabBar}
        navigationState={{ index: tabIndex, routes: tabs }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
      />

      <Modal visible={actionsMenuOpen} transparent animationType="slide" onRequestClose={() => setActionsMenuOpen(false)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setActionsMenuOpen(false)}>
          <View style={styles.sheet}>
            <TouchableOpacity style={styles.sheetItem} onPress={handleEdit}>
              <Text>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={handleCreateWorkOrder}>
              <Text>Crear orden de trabajo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={handleCreateChildAsset}>
              <Text>Crear subactivo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={handleDelete}>
              <Text style={{ color: theme.colors.error }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  rowCard: { backgroundColor: '#ffffff', padding: 14, borderRadius: 8, marginBottom: 8 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingVertical: 8 },
  sheetItem: { paddingVertical: 16, paddingHorizontal: 20 },
});
