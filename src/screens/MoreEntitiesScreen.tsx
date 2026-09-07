import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import type { PermissionEntity } from '../api/me';

function getEntities(theme: any) {
  return [
    { label: 'Ubicaciones', icon: 'map-marker', color: '#2491d1', backgroundColor: '#c8cfd3', route: 'Locations', permission: 'LOCATIONS' as PermissionEntity },
    { label: 'Activos', icon: 'package-variant-closed', color: theme.colors.warning, backgroundColor: '#d2d0c4', route: 'Assets', permission: 'ASSETS' as PermissionEntity },
    { label: 'Repuestos', icon: 'archive-outline', color: '#8324d1', backgroundColor: '#cfc8d3', permission: 'PARTS_AND_MULTIPARTS' as PermissionEntity },
    { label: 'Medidores', icon: 'gauge', color: '#d12444', backgroundColor: '#d3c8ca', route: 'Meters', permission: 'METERS' as PermissionEntity },
    { label: 'Personas y equipos', icon: 'account', color: '#245bd1', backgroundColor: '#c8ccd3', permission: 'PEOPLE_AND_TEAMS' as PermissionEntity },
    { label: 'Proveedores y clientes', icon: 'vector-circle', color: theme.colors.warning, backgroundColor: '#d2d0c4', permission: 'VENDORS_AND_CUSTOMERS' as PermissionEntity },
  ];
}

export default function MoreEntitiesScreen({ navigation }: any) {
  const theme = useTheme();
  const { hasViewPermission } = useAuth();
  const visibles = getEntities(theme).filter((entity) => hasViewPermission(entity.permission));

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 10 }}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* El real no muestra nada cuando la lista queda vacia. Aca se avisa
          porque sin esto la pantalla se ve en blanco sin explicacion --
          unica desviacion, y solo aplica a un rol sin ningun permiso. */}
      {visibles.length === 0 && (
        <View style={{ padding: 24 }}>
          <Text variant="bodyMedium" style={{ textAlign: 'center', color: '#6B7280' }}>
            Tu rol no tiene permiso para ver ninguno de estos módulos.
          </Text>
        </View>
      )}

      {visibles.map((entity) => (
        <TouchableOpacity key={entity.label} onPress={() => navigation.navigate(entity.route ?? 'ComingSoon', entity.route ? undefined : { label: entity.label })}>
          <View style={[styles.row, { backgroundColor: entity.backgroundColor }]}>
            <Text variant="titleMedium">{entity.label}</Text>
            <IconButton icon={entity.icon} iconColor={entity.color} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    marginVertical: 5,
    borderRadius: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 20,
  },
});
