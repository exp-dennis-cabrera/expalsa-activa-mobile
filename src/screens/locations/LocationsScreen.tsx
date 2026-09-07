import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Avatar, Button, SegmentedButtons, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { locationsApi, type Location } from '../../api/locations';

function LocationCard({
  location,
  navigation,
  showChildrenButton,
  onViewChildren,
}: {
  location: Location;
  navigation: any;
  showChildrenButton?: boolean;
  onViewChildren?: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('LocationDetail', { id: location.id })}>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {location.imageUrl ? (
            <Avatar.Image size={50} source={{ uri: location.imageUrl }} />
          ) : (
            <Avatar.Icon style={{ backgroundColor: theme.colors.background }} color="white" icon="map-marker-outline" size={50} />
          )}
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              {location.name}
            </Text>
            <Text variant="bodySmall" style={{ color: 'grey' }}>
              #{location.customId ?? location.id}
            </Text>
            {location.address && (
              <Text variant="bodySmall" style={{ color: theme.colors.grey ?? 'grey', marginTop: 4 }}>
                🗺️ {location.address}
              </Text>
            )}
            {showChildrenButton && (
              <View style={styles.cardFooter}>
                <View style={{ flex: 1 }} />
                <Button compact onPress={onViewChildren}>
                  Ver sububicaciones
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function LocationsScreen({ navigation }: any) {
  const theme = useTheme();
  const [view, setView] = useState<'hierarchy' | 'list'>('hierarchy');
  const [search, setSearch] = useState('');
  const [flatLocations, setFlatLocations] = useState<Location[]>([]);
  const [currentLevelLocations, setCurrentLevelLocations] = useState<Location[]>([]);
  const [levelStack, setLevelStack] = useState<{ id: number; name: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentParentId = levelStack.length ? levelStack[levelStack.length - 1].id : 0;

  const load = useCallback(() => {
    setLoadError(null);
    if (view === 'list') {
      locationsApi.list(0, 50, search || undefined).then((r) => setFlatLocations(r.content)).catch((err) => setLoadError(err?.message ?? 'Error cargando la lista.'));
    } else {
      locationsApi.children(currentParentId).then(setCurrentLevelLocations).catch((err) => setLoadError(err?.message ?? 'Error cargando la jerarquía.'));
    }
  }, [view, search, currentParentId]);

  useFocusEffect(load);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Buscar…"
        value={search}
        onChangeText={(v) => {
          setSearch(v);
          setView('list');
        }}
        style={{ backgroundColor: theme.colors.background }}
      />
      <SegmentedButtons
        value={view}
        onValueChange={(v) => setView(v as 'hierarchy' | 'list')}
        style={{ marginHorizontal: 12, marginTop: 8 }}
        buttons={[
          { value: 'hierarchy', label: 'Jerarquía', icon: 'file-tree' },
          { value: 'list', label: 'Lista', icon: 'format-list-bulleted' },
        ]}
      />
      {view === 'hierarchy' && levelStack.length > 0 && (
        <Button icon="arrow-left" onPress={() => setLevelStack((prev) => prev.slice(0, -1))} style={{ alignSelf: 'flex-start', marginLeft: 8 }}>
          {levelStack[levelStack.length - 1].name}
        </Button>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} colors={[theme.colors.primary]} onRefresh={() => { setRefreshing(true); load(); setRefreshing(false); }} />}
      >
        {loadError && (
          <View style={styles.empty}>
            <Text variant="titleSmall" style={{ color: theme.colors.error }}>
              {loadError}
            </Text>
          </View>
        )}
        {view === 'list' ? (
          flatLocations.length === 0 ? (
            <View style={styles.empty}>
              <Text variant="titleMedium">No hay ubicaciones que coincidan.</Text>
            </View>
          ) : (
            flatLocations.map((location) => <LocationCard key={location.id} location={location} navigation={navigation} />)
          )
        ) : currentLevelLocations.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="titleMedium">No hay ubicaciones en este nivel.</Text>
          </View>
        ) : (
          currentLevelLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              navigation={navigation}
              showChildrenButton
              onViewChildren={() => setLevelStack((prev) => [...prev, { id: location.id, name: location.name }])}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { backgroundColor: '#ffffff', padding: 20, borderRadius: 10, margin: 12 },
  card: { backgroundColor: '#ffffff', marginBottom: 1, padding: 10 },
  cardRow: { flexDirection: 'row' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});
