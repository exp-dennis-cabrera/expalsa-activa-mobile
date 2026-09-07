import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Avatar, Chip, Icon, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { requestsApi, type RequestItem } from '../../api/requests';

const PRIORITY_LABELS: Record<string, string> = { NONE: 'Ninguna', LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta' };
const PRIORITY_COLORS: Record<string, string> = { NONE: '#9DA1A1', LOW: '#33C2FF', MEDIUM: '#F2A93B', HIGH: '#D8341E' };

// Igual que getStatusMeta() real: Aprobada si ya tiene una orden generada,
// Rechazada si esta cancelada, Pendiente en cualquier otro caso.
function statusMeta(request: RequestItem, theme: any): [string, string] {
  if (request.workOrderId) return ['Aprobada', theme.colors.success];
  if (request.cancelled) return ['Rechazada', theme.colors.error];
  return ['Pendiente', theme.colors.primary];
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export default function RequestsScreen({ navigation }: any) {
  const theme = useTheme();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    requestsApi.list().then(setRequests).catch(() => {});
  }, []);

  useFocusEffect(load);

  const filtered = requests.filter((r) => !search.trim() || r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar placeholder="Buscar…" value={search} onChangeText={setSearch} style={{ backgroundColor: theme.colors.background }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} colors={[theme.colors.primary]} onRefresh={() => { setRefreshing(true); load(); setRefreshing(false); }} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="titleLarge">No hay solicitudes que coincidan.</Text>
          </View>
        ) : (
          filtered.map((request) => {
            const [statusLabel, statusColor] = statusMeta(request, theme);
            const dueSoonOrOverdue =
              !!request.dueDate && (dayDiff(new Date(request.dueDate), new Date()) <= 2 || new Date() > new Date(request.dueDate)) && request.status !== 'APPROVED';
            return (
              <TouchableOpacity
                key={request.id}
                onPress={() =>
                  request.workOrderId
                    ? navigation.navigate('WorkOrderDetail', { id: request.workOrderId })
                    : navigation.navigate('RequestDetail', { id: request.id })
                }
              >
                <View style={styles.card}>
                  <View style={styles.cardRow}>
                    <Avatar.Icon style={{ backgroundColor: theme.colors.background }} color="white" icon="inbox-arrow-down-outline" size={50} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <View style={styles.cardHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={2}>
                            {request.title}
                          </Text>
                          <Text variant="bodySmall" style={styles.muted}>
                            #{request.customId ?? request.id}
                          </Text>
                        </View>
                        <Chip compact textStyle={{ color: 'white', fontSize: 11 }} style={{ backgroundColor: statusColor }}>
                          {statusLabel}
                        </Chip>
                      </View>
                      <View style={styles.cardBody}>
                        {/* Igual que IconWithLabel real: icono + texto, no emojis. */}
                        {request.assetName && (
                          <View style={styles.iconLine}>
                            <Icon source="package-variant-closed" size={16} color={theme.colors.grey ?? 'grey'} />
                            <Text variant="bodySmall" style={[styles.muted, { marginLeft: 4 }]}>
                              {request.assetName}
                            </Text>
                          </View>
                        )}
                        {request.locationName && (
                          <View style={styles.iconLine}>
                            <Icon source="map-marker-outline" size={16} color={theme.colors.grey ?? 'grey'} />
                            <Text variant="bodySmall" style={[styles.muted, { marginLeft: 4 }]}>
                              {request.locationName}
                            </Text>
                          </View>
                        )}
                        {/* Igual que el Tag real: fondo transparente, texto del color de la prioridad. */}
                        {request.priority !== 'NONE' && (
                          <Chip
                            compact
                            style={{ backgroundColor: 'transparent', alignSelf: 'flex-start' }}
                            textStyle={{ color: PRIORITY_COLORS[request.priority], fontSize: 11 }}
                          >
                            {PRIORITY_LABELS[request.priority]}
                          </Chip>
                        )}
                      </View>
                      {request.dueDate && (
                        <View style={[styles.iconLine, { marginTop: 6 }]}>
                          <Icon
                            source="clock-alert-outline"
                            size={16}
                            color={dueSoonOrOverdue ? theme.colors.error : theme.colors.grey ?? 'grey'}
                          />
                          <Text
                            variant="bodySmall"
                            style={[
                              { marginLeft: 4 },
                              dueSoonOrOverdue ? { color: theme.colors.error } : styles.muted,
                            ]}
                          >
                            {new Date(request.dueDate).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { backgroundColor: '#ffffff', padding: 20, borderRadius: 10, margin: 12 },
  card: { backgroundColor: '#ffffff', marginBottom: 1, padding: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardRow: { flexDirection: 'row' },
  cardTitle: { fontWeight: 'bold' },
  cardBody: { gap: 6 },
  muted: { color: '#6B7280' },
  iconLine: { flexDirection: 'row', alignItems: 'center' },
});
