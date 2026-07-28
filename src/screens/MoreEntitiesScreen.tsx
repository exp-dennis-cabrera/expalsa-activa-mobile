import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

function getEntities(theme: any) {
  return [
    { label: 'Ubicaciones', icon: 'map-marker', color: '#2491d1', backgroundColor: '#c8cfd3', route: 'Locations' },
    { label: 'Activos', icon: 'package-variant-closed', color: theme.colors.warning, backgroundColor: '#d2d0c4', route: 'Assets' },
    { label: 'Repuestos', icon: 'archive-outline', color: '#8324d1', backgroundColor: '#cfc8d3' },
    { label: 'Medidores', icon: 'gauge', color: '#d12444', backgroundColor: '#d3c8ca', route: 'Meters' },
    { label: 'Personas y equipos', icon: 'account', color: '#245bd1', backgroundColor: '#c8ccd3' },
    { label: 'Proveedores y clientes', icon: 'vector-circle', color: theme.colors.warning, backgroundColor: '#d2d0c4' },
  ];
}

export default function MoreEntitiesScreen({ navigation }: any) {
  const theme = useTheme();

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 10 }}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {getEntities(theme).map((entity) => (
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
