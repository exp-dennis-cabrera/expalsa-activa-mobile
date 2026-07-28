import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Avatar, Chip, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { metersApi, type Meter } from '../../api/meters';

export default function MetersScreen({ navigation }: any) {
  const theme = useTheme();
  const [meters, setMeters] = useState<Meter[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    metersApi.list().then(setMeters).catch(() => {});
  }, []);

  useFocusEffect(load);

  const filtered = meters.filter((m) => !search.trim() || m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar placeholder="Buscar…" value={search} onChangeText={setSearch} style={{ backgroundColor: theme.colors.background }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} colors={[theme.colors.primary]} onRefresh={() => { setRefreshing(true); load(); setRefreshing(false); }} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="titleMedium">No hay medidores que coincidan.</Text>
          </View>
        ) : (
          filtered.map((meter) => (
            <TouchableOpacity key={meter.id} onPress={() => navigation.navigate('MeterDetail', { id: meter.id })}>
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Avatar.Icon style={{ backgroundColor: theme.colors.background }} color="white" icon="gauge" size={50} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                      {meter.name}
                    </Text>
                    <View style={styles.cardBody}>
                      {meter.assetName && (
                        <Text variant="bodySmall" style={styles.muted}>
                          📦 {meter.assetName}
                        </Text>
                      )}
                      {meter.locationName && (
                        <Text variant="bodySmall" style={styles.muted}>
                          📍 {meter.locationName}
                        </Text>
                      )}
                      {meter.pastDue && (
                        <Chip compact style={{ backgroundColor: theme.colors.error, alignSelf: 'flex-start' }} textStyle={{ color: 'white', fontSize: 11 }}>
                          Vencida
                        </Chip>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
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
  cardBody: { gap: 6, marginTop: 4 },
  muted: { color: '#6B7280' },
});
