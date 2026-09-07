import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';
import SettingsScreen from '../screens/SettingsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import WorkOrderStatsScreen from '../screens/WorkOrderStatsScreen';
import WorkOrderFiltersScreen from '../screens/workOrders/WorkOrderFiltersScreen';
import SelectListScreen from '../screens/SelectListScreen';
import WorkOrderDetailScreen from '../screens/workOrders/WorkOrderDetailScreen';
import CreateWorkOrderScreen from '../screens/workOrders/CreateWorkOrderScreen';
import CompleteWorkOrderScreen from '../screens/workOrders/CompleteWorkOrderScreen';
import MetersScreen from '../screens/meters/MetersScreen';
import MeterDetailScreen from '../screens/meters/MeterDetailScreen';
import CreateMeterScreen from '../screens/meters/CreateMeterScreen';
import AssetsScreen from '../screens/assets/AssetsScreen';
import AssetDetailScreen from '../screens/assets/AssetDetailScreen';
import CreateAssetScreen from '../screens/assets/CreateAssetScreen';
import ScanAssetScreen from '../screens/assets/ScanAssetScreen';
import SelectBarcodeScreen from '../screens/assets/SelectBarcodeScreen';
import SelectNfcScreen from '../screens/assets/SelectNfcScreen';
import RequestDetailScreen from '../screens/requests/RequestDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CreateRequestScreen from '../screens/requests/CreateRequestScreen';
import LocationsScreen from '../screens/locations/LocationsScreen';
import LocationDetailScreen from '../screens/locations/LocationDetailScreen';
import CreateLocationScreen from '../screens/locations/CreateLocationScreen';

const Stack = createNativeStackNavigator();

function AuthenticatedRoot() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Root" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="WorkOrderStats" component={WorkOrderStatsScreen} options={{ title: 'Estadísticas' }} />
      <Stack.Screen name="WorkOrderFilters" component={WorkOrderFiltersScreen} options={{ title: 'Filtros' }} />
      <Stack.Screen name="SelectList" component={SelectListScreen} />
      <Stack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="AddWorkOrder" component={CreateWorkOrderScreen} options={{ title: 'Nueva orden de trabajo' }} />
      <Stack.Screen name="CompleteWorkOrder" component={CompleteWorkOrderScreen} options={{ title: 'Completar orden' }} />
      <Stack.Screen
        name="Meters"
        component={MetersScreen}
        options={({ navigation }) => ({
          title: 'Medidores',
          headerRight: () => <IconButton icon="plus" onPress={() => navigation.navigate('AddMeter')} />,
        })}
      />
      <Stack.Screen name="MeterDetail" component={MeterDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="AddMeter" component={CreateMeterScreen} options={{ title: 'Nuevo medidor' }} />
      <Stack.Screen
        name="Assets"
        component={AssetsScreen}
        options={({ navigation }) => ({
          title: 'Activos',
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <IconButton icon="barcode-scan" onPress={() => navigation.navigate('ScanAsset')} />
              <IconButton icon="plus" onPress={() => navigation.navigate('AddAsset')} />
            </View>
          ),
        })}
      />
      <Stack.Screen name="AssetDetail" component={AssetDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="AddAsset" component={CreateAssetScreen} options={{ title: 'Nuevo activo' }} />
      <Stack.Screen name="ScanAsset" component={ScanAssetScreen} options={{ title: 'Escanear' }} />
      <Stack.Screen name="SelectBarcode" component={SelectBarcodeScreen} options={{ title: 'Código de barras' }} />
      <Stack.Screen name="SelectNfc" component={SelectNfcScreen} options={{ title: 'NFC' }} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="AddRequest" component={CreateRequestScreen} options={{ title: 'Nueva solicitud' }} />
      <Stack.Screen
        name="Locations"
        component={LocationsScreen}
        options={({ navigation }) => ({
          title: 'Ubicaciones',
          headerRight: () => <IconButton icon="plus" onPress={() => navigation.navigate('AddLocation')} />,
        })}
      />
      <Stack.Screen name="LocationDetail" component={LocationDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="AddLocation" component={CreateLocationScreen} options={{ title: 'Nueva ubicación' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <NavigationContainer ref={navigationRef}>{isAuthenticated ? <AuthenticatedRoot /> : <AuthNavigator />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ebecf6' },
});
