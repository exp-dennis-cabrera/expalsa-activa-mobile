import { useCallback, useLayoutEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Modal, Alert, useWindowDimensions } from 'react-native';
import { Text, IconButton, useTheme, ActivityIndicator, Chip } from 'react-native-paper';
import { TabBar, TabView } from 'react-native-tab-view';
import { useFocusEffect } from '@react-navigation/native';
import { locationsApi, type Location } from '../../api/locations';
import { getApiClient } from '../../api/client';
import { STATUS_LABELS, statusColor } from '../assets/AssetsScreen';

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

// --- Escena: Detalles -- igual que LocationDetails.tsx real ---
function DetailsScene({ location, theme }: { location: Location; theme: any }) {
  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {location.imageUrl && <Image source={{ uri: location.imageUrl }} style={styles.headerImage} />}
      <BasicField label="Nombre" value={location.name} />
      <BasicField label="Dirección" value={location.address} />
      <ObjectField label="Ubicación padre" value={location.parentLocationName} theme={theme} />
      <ListField label="Asignado a" values={location.assignedUsers} />
      <ListField label="Proveedores" values={location.vendors} />
      <ListField label="Equipos" values={location.teams} />
    </ScrollView>
  );
}

// --- Escena: Órdenes de trabajo -- igual que LocationWorkOrders.tsx real ---
function WorkOrdersScene({ locationId, navigation, theme }: { locationId: number; navigation: any; theme: any }) {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  useFocusEffect(
    useCallback(() => {
      getApiClient().then((client) => client.get(`/locations/${locationId}/work-orders`)).then((r) => setWorkOrders(r.data)).catch(() => {});
    }, [locationId]),
  );
  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 12, paddingBottom: 60 }}>
      {workOrders.length === 0 ? (
        <Text style={{ padding: 20 }}>Sin órdenes de trabajo para esta ubicación.</Text>
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

// --- Escena: Archivos -- igual que LocationFiles.tsx real ---
function FilesScene({ locationId, theme }: { locationId: number; theme: any }) {
  const [files, setFiles] = useState<any[]>([]);
  useFocusEffect(
    useCallback(() => {
      getApiClient().then((client) => client.get(`/locations/${locationId}/files`)).then((r) => setFiles(r.data)).catch(() => {});
    }, [locationId]),
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

// --- Escena: Activos -- igual que LocationAssets.tsx real ---
function AssetsScene({ locationId, navigation, theme }: { locationId: number; navigation: any; theme: any }) {
  const [assets, setAssets] = useState<any[]>([]);
  useFocusEffect(
    useCallback(() => {
      getApiClient().then((client) => client.get(`/locations/${locationId}/assets`)).then((r) => setAssets(r.data)).catch(() => {});
    }, [locationId]),
  );
  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 12, paddingBottom: 60 }}>
      {assets.length === 0 ? (
        <Text style={{ padding: 20 }}>Sin activos en esta ubicación.</Text>
      ) : (
        assets.map((a: any) => (
          <TouchableOpacity key={a.id} onPress={() => navigation.navigate('AssetDetail', { id: a.id })}>
            <View style={[styles.rowCard, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={{ fontWeight: 'bold', flexShrink: 1, marginRight: 10 }}>{a.name}</Text>
              <Chip compact style={{ backgroundColor: statusColor(a.status, theme) }} textStyle={{ color: 'white', fontSize: 11 }}>
                {STATUS_LABELS[a.status]}
              </Chip>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

export default function LocationDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const theme = useTheme();
  const layout = useWindowDimensions();
  const [location, setLocation] = useState<Location | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [tabs] = useState([
    { key: 'details', title: 'Detalles' },
    { key: 'work-orders', title: 'Órdenes' },
    { key: 'files', title: 'Archivos' },
    { key: 'assets', title: 'Activos' },
  ]);

  const load = useCallback(() => {
    locationsApi.getById(id).then(setLocation).catch(() => {});
  }, [id]);

  useFocusEffect(load);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: location?.name ?? 'Cargando…',
      headerRight: () => (location ? <IconButton icon="dots-vertical" onPress={() => setActionsMenuOpen(true)} /> : null),
    });
  }, [navigation, location]);

  function handleEdit() {
    setActionsMenuOpen(false);
    navigation.navigate('AddLocation', { location });
  }

  function handleDelete() {
    setActionsMenuOpen(false);
    Alert.alert('Eliminar ubicación', 'Esta acción no se puede deshacer. ¿Eliminar esta ubicación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await locationsApi.delete(id);
          navigation.goBack();
        },
      },
    ]);
  }

  function handleCreateChildLocation() {
    setActionsMenuOpen(false);
    navigation.navigate('AddLocation', { parentLocation: location });
  }

  function handleCreateAsset() {
    setActionsMenuOpen(false);
    navigation.navigate('AddAsset', { location });
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'details':
        return <DetailsScene location={location} theme={theme} />;
      case 'work-orders':
        return <WorkOrdersScene locationId={id} navigation={navigation} theme={theme} />;
      case 'files':
        return <FilesScene locationId={id} theme={theme} />;
      case 'assets':
        return <AssetsScene locationId={id} navigation={navigation} theme={theme} />;
      default:
        return null;
    }
  };

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
            <TouchableOpacity style={styles.sheetItem} onPress={handleCreateChildLocation}>
              <Text>Crear sububicación</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetItem} onPress={handleCreateAsset}>
              <Text>Crear activo</Text>
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
