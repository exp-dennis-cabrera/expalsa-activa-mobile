import { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Text, Chip, ActivityIndicator, Searchbar, Avatar, IconButton, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { workOrdersApi, type WorkOrder, type WorkOrderPriority, type WorkOrderStatus, type AdvancedFilters } from '../../api/workOrders';
import { useAuth } from '../../context/AuthContext';
import EnumFilterButton from '../../components/EnumFilterButton';

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  OPEN: 'Abierta',
  IN_PROGRESS: 'En progreso',
  ON_HOLD: 'En espera',
  COMPLETED: 'Completada',
};

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  OPEN: '#8891a8',
  IN_PROGRESS: '#4caf50',
  ON_HOLD: '#f2a93b',
  COMPLETED: '#5b6df8',
};

const PRIORITY_LABELS: Record<WorkOrderPriority, string> = {
  NONE: 'Sin prioridad',
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

const PRIORITY_COLORS: Record<WorkOrderPriority, string> = {
  NONE: '#9CA3AF',
  LOW: '#3B82F6',
  MEDIUM: '#F2A93B',
  HIGH: '#D8341E',
};

const DEFAULT_STATUS_FILTER: WorkOrderStatus[] = ['OPEN', 'IN_PROGRESS', 'ON_HOLD'];
const ALL_STATUSES: WorkOrderStatus[] = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];
const ALL_PRIORITIES: WorkOrderPriority[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];

function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function sameStatusSet(a: WorkOrderStatus[], b: WorkOrderStatus[]): boolean {
  return a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
}

// Igual que isCloseToBottom de utils/overall.ts real.
function isCloseToBottom({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent): boolean {
  const threshold = layoutMeasurement.height * 0.5;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
}

export default function WorkOrdersListScreen({ navigation, route }: any) {
  const theme = useTheme();
  const { userId } = useAuth();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus[]>(DEFAULT_STATUS_FILTER);
  const [priorityFilter, setPriorityFilter] = useState<WorkOrderPriority[]>(ALL_PRIORITIES);
  const [assignedOnly, setAssignedOnly] = useState(false);
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [error, setError] = useState<string | null>(null);

  const hasAdvancedFilters = Object.values(advancedFilters).some((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== false));
  const isDefaultFilter = sameStatusSet(statusFilter, DEFAULT_STATUS_FILTER) && priorityFilter.length === ALL_PRIORITIES.length && !assignedOnly && !dueTodayOnly && !search && !hasAdvancedFilters;

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(searchInput), 1000);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  async function loadPage(targetPage: number, append: boolean) {
    try {
      const response = await workOrdersApi.search(targetPage, 20, {
        status: statusFilter.length ? statusFilter : undefined,
        priority: priorityFilter.length === ALL_PRIORITIES.length ? undefined : priorityFilter,
        search: search || undefined,
        assignedToUserId: assignedOnly ? userId ?? undefined : undefined,
        ...advancedFilters,
      });
      setWorkOrders((prev) => (append ? [...prev, ...response.content] : response.content));
      setHasMore(targetPage + 1 < response.totalPages);
      setPage(targetPage);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'No se pudieron cargar las órdenes. Revisá tu conexión.');
      if (!append) setWorkOrders([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }

  const lastAppliedParams = useRef<string>('');
  useFocusEffect(
    useCallback(() => {
      const params = route?.params ?? {};
      const paramsKey = JSON.stringify(params);
      if (paramsKey === lastAppliedParams.current) return;
      lastAppliedParams.current = paramsKey;
      setStatusFilter(params.status ? [params.status] : DEFAULT_STATUS_FILTER);
      setPriorityFilter(params.highPriority ? ['HIGH'] : ALL_PRIORITIES);
      setDueTodayOnly(!!params.dueToday);
      setAssignedOnly(!!params.assignedOnly);
    }, [route?.params]),
  );

  useEffect(() => {
    setLoading(true);
    loadPage(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, assignedOnly, search, advancedFilters]);

  function handleScroll({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) {
    if (isCloseToBottom(nativeEvent) && !loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadPage(page + 1, true);
    }
  }

  function resetFilters() {
    setStatusFilter(DEFAULT_STATUS_FILTER);
    setPriorityFilter(ALL_PRIORITIES);
    setAssignedOnly(false);
    setDueTodayOnly(false);
    setSearchInput('');
    setAdvancedFilters({});
  }

  const displayed = dueTodayOnly
    ? workOrders.filter((wo) => {
        if (!wo.dueDate) return false;
        const d = new Date(wo.dueDate);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      })
    : workOrders;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar placeholder="Buscar orden…" value={searchInput} onChangeText={setSearchInput} style={{ backgroundColor: theme.colors.background }} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPage(0, false);
            }}
            colors={[theme.colors.primary]}
          />
        }
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          <IconButton
            icon={hasAdvancedFilters ? 'filter-check' : 'filter-outline'}
            iconColor={hasAdvancedFilters ? 'white' : undefined}
            style={{ backgroundColor: hasAdvancedFilters ? theme.colors.primary : theme.colors.background }}
            onPress={() =>
              navigation.navigate('WorkOrderFilters', {
                current: advancedFilters,
                onApply: (f: AdvancedFilters) => setAdvancedFilters(f),
                onReset: () => setAdvancedFilters({}),
              })
            }
          />

          <TouchableOpacity
            onPress={() => setAssignedOnly((v) => !v)}
            style={[styles.pill, { backgroundColor: assignedOnly ? theme.colors.primary : theme.colors.background }]}
          >
            <Text style={{ color: assignedOnly ? 'white' : 'black', fontWeight: 'bold' }}>Mi trabajo</Text>
          </TouchableOpacity>

          <EnumFilterButton
            label="Prioridad"
            allOptions={ALL_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
            selected={priorityFilter}
            defaultSelected={ALL_PRIORITIES}
            onChange={setPriorityFilter}
          />

          <EnumFilterButton
            label="Estado"
            allOptions={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            selected={statusFilter}
            defaultSelected={DEFAULT_STATUS_FILTER}
            onChange={setStatusFilter}
          />

          {!isDefaultFilter && (
            <IconButton icon="close" iconColor={theme.colors.error} style={{ backgroundColor: theme.colors.background }} onPress={resetFilters} />
          )}
        </ScrollView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : displayed.length === 0 ? (
          <View style={styles.center}>
            <Text>{error ?? 'No hay órdenes que coincidan.'}</Text>
          </View>
        ) : (
          displayed.map((item) => {
            const allAssignees = [
              ...(item.primaryAssigneeId && item.primaryAssigneeName ? [{ id: item.primaryAssigneeId, fullName: item.primaryAssigneeName }] : []),
              ...(item.assignees ?? []).filter((a) => a.id !== item.primaryAssigneeId),
            ];
            const dueSoonOrOverdue =
              !!item.dueDate &&
              item.status !== 'COMPLETED' &&
              (dayDiff(new Date(item.dueDate), new Date()) <= 2 || new Date() > new Date(item.dueDate));

            return (
              <TouchableOpacity key={item.id} onPress={() => navigation.navigate('WorkOrderDetail', { id: item.id })}>
                <View style={[styles.card, styles.cardRow]}>
                  {item.imageUrl ? (
                    <Avatar.Image size={50} source={{ uri: item.imageUrl }} />
                  ) : (
                    <Avatar.Icon style={{ backgroundColor: theme.colors.background }} color="white" icon="clipboard-text-outline" size={50} />
                  )}
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text variant="bodySmall" style={styles.muted}>
                          #{item.customId ?? item.id}
                        </Text>
                      </View>
                      <Chip compact textStyle={{ color: 'white', fontSize: 11 }} style={{ backgroundColor: STATUS_COLORS[item.status] }}>
                        {STATUS_LABELS[item.status]}
                      </Chip>
                    </View>

                    <View style={styles.cardBody}>
                      {item.assetName && (
                        <View style={styles.iconLabel}>
                          <IconButton icon="package-variant-closed" size={14} style={styles.iconBtn} />
                          <Text variant="bodySmall" style={styles.muted}>
                            {item.assetName}
                          </Text>
                        </View>
                      )}
                      {item.locationName && (
                        <View style={styles.iconLabel}>
                          <IconButton icon="map-marker-outline" size={14} style={styles.iconBtn} />
                          <Text variant="bodySmall" style={styles.muted}>
                            {item.locationName}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.iconLabel}>
                        {item.priority !== 'NONE' && (
                          <Text variant="bodySmall" style={{ color: PRIORITY_COLORS[item.priority], fontWeight: 'bold' }}>
                            {PRIORITY_LABELS[item.priority]}
                          </Text>
                        )}
                        {item.dueDate && (
                          <Text variant="bodySmall" style={[{ marginLeft: 10 }, dueSoonOrOverdue ? { color: theme.colors.error } : styles.muted]}>
                            {new Date(item.dueDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      {allAssignees.length > 0 && (
                        <View style={styles.assigneeContainer}>
                          {allAssignees.slice(0, 3).map((a, index) => (
                            <View key={a.id} style={{ marginLeft: index > 0 ? -8 : 0 }}>
                              <Avatar.Text size={24} label={initials(a.fullName)} />
                            </View>
                          ))}
                          {allAssignees.length > 3 && (
                            <Text variant="bodySmall" style={{ marginLeft: 8 }}>
                              +{allAssignees.length - 3}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {loadingMore && <ActivityIndicator style={{ marginVertical: 12 }} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  scrollView: { width: '100%', height: '100%' },
  filterBar: { backgroundColor: '#ffffff', borderRadius: 5, marginBottom: 2 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  card: { backgroundColor: '#ffffff', marginBottom: 1, padding: 10 },
  cardRow: { flexDirection: 'row' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontWeight: 'bold', flexShrink: 1 },
  cardBody: { gap: 4, marginBottom: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconLabel: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { margin: 0, marginRight: -4 },
  muted: { color: '#6B7280' },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 20, paddingHorizontal: 15, margin: 5 },
  assigneeContainer: { flexDirection: 'row', alignItems: 'center' },
});
