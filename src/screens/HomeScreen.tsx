import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, IconButton, Badge, Switch, Button, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { meApi, type MobileOverview, type UserSettings } from '../api/me';
import { useAuth } from '../context/AuthContext';

// Misma logica que el real: cada estadistica lleva su propio filtro, y si
// "solo asignadas a mi" esta activo, se le suma tambien ese filtro (igual
// que el push a filterFields en HomeScreen.tsx real).
function statParams(key: string, settings: UserSettings | null) {
  const base =
    key === 'TODAY'
      ? { dueToday: true }
      : key === 'HIGH'
        ? { highPriority: true }
        : { status: key as any };
  return { ...base, assignedOnly: !!settings?.statsForAssignedWorkOrders };
}

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme() as any;
  const { hasViewPermission } = useAuth();
  const [overview, setOverview] = useState<MobileOverview | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Misma funcion getStatusColor del real (utils/overall.ts), con los
  // mismos colores del tema -- COMPLETE es negro puro, no un color, tal
  // cual el original (llamativo, pero es lo que hace el real).
  const statusColors: Record<string, string> = {
    OPEN: theme.colors.tertiary,
    ON_HOLD: theme.colors.warning,
    IN_PROGRESS: theme.colors.success,
    COMPLETED: 'black',
    TODAY: theme.colors.primary,
    HIGH: theme.colors.error,
  };

  const load = useCallback(() => {
    setLoadError(null);
    meApi
      .getSettings()
      .then((s) => {
        setSettings(s);
        return meApi.getMobileOverview(s.statsForAssignedWorkOrders).then(setOverview);
      })
      .catch((err: any) => setLoadError(err?.response?.data?.message ?? 'No se pudo cargar el panel de inicio.'));
    meApi.getUnreadNotificationCount().then(setUnreadCount).catch(() => {});
  }, []);

  useFocusEffect(load);

  async function handleToggleAssignedOnly(value: boolean) {
    if (!settings) return;
    const updated = await meApi.updateSettings({ statsForAssignedWorkOrders: value });
    setSettings(updated);
    meApi.getMobileOverview(updated.statsForAssignedWorkOrders).then(setOverview);
  }

  const stats = overview
    ? [
        { key: 'OPEN', label: 'Abiertas', value: overview.open },
        { key: 'ON_HOLD', label: 'En espera', value: overview.onHold },
        { key: 'IN_PROGRESS', label: 'En progreso', value: overview.inProgress },
        { key: 'COMPLETED', label: 'Completadas', value: overview.complete },
        { key: 'TODAY', label: 'Vencen hoy', value: overview.today },
        { key: 'HIGH', label: 'Alta prioridad', value: overview.high },
      ]
    : [];

  // Desviacion a proposito del real: el original usa theme.colors.background
  // (el mismo lavanda de toda la pantalla), lo que deja el circulo casi
  // invisible. Elegido a proposito usar blanco, con contraste real.
  const iconButtonStyle = { ...styles.iconButton, backgroundColor: theme.colors.surface };

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100 }}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          colors={[theme.colors.primary]}
          onRefresh={() => {
            setRefreshing(true);
            load();
            setRefreshing(false);
          }}
        />
      }
    >
      <View style={styles.iconRow}>
        {/* Igual que el real: escanear y activos solo se muestran si el rol
            tiene permiso de ver Activos. */}
        {hasViewPermission('ASSETS') && (
          <IconButton style={iconButtonStyle} icon="magnify-scan" onPress={() => navigation.navigate('ScanAsset')} />
        )}
        <IconButton style={iconButtonStyle} icon="poll" onPress={() => navigation.navigate('WorkOrderStats')} />
        <View style={[iconButtonStyle, styles.notifWrapper]}>
          <IconButton icon="bell-outline" onPress={() => navigation.navigate('Notifications')} />
          <Badge style={[styles.badge, { backgroundColor: theme.colors.error }]} visible={unreadCount > 0}>
            {unreadCount}
          </Badge>
        </View>
        {hasViewPermission('ASSETS') && (
          <IconButton
            style={iconButtonStyle}
            icon="package-variant-closed"
            onPress={() => navigation.navigate('Assets')}
          />
        )}
      </View>

      <View style={styles.toggleRow}>
        <Text style={{ color: theme.colors.grey }}>Solo asignadas a mí</Text>
        <Switch value={settings?.statsForAssignedWorkOrders ?? false} onValueChange={handleToggleAssignedOnly} />
      </View>

      {loadError && (
        <View style={[styles.statRow, { alignItems: 'center', paddingVertical: 16 }]}>
          <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{loadError}</Text>
          <Button mode="outlined" onPress={load}>
            Reintentar
          </Button>
        </View>
      )}

      {stats.map((stat) => (
        <View key={stat.key} style={styles.statRow}>
          <TouchableOpacity style={styles.statTouchable} onPress={() => navigation.navigate('WorkOrdersTab', { screen: 'WorkOrdersList', params: statParams(stat.key, settings) })}>
            <View style={styles.statLeft}>
              <View style={[styles.statBar, { backgroundColor: statusColors[stat.key] }]} />
              <Text variant="titleSmall" style={styles.statLabel}>
                {stat.label}
              </Text>
            </View>
            <View style={styles.statRight}>
              <Text style={{ color: theme.colors.grey }}>{stat.value}</Text>
              <IconButton icon="chevron-double-right" iconColor={theme.colors.grey} />
            </View>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  iconButton: { width: 50, height: 50, borderRadius: 25 },
  notifWrapper: { position: 'relative' },
  badge: { position: 'absolute', bottom: 0, right: 0 },
  toggleRow: {
    marginHorizontal: 10,
    marginTop: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  statRow: {
    marginHorizontal: 10,
    marginTop: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  statTouchable: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  statLeft: { flexDirection: 'row', alignItems: 'center' },
  statBar: { width: 3, height: 30, borderRadius: 2 },
  statLabel: { fontWeight: 'bold', marginLeft: 10 },
  statRight: { flexDirection: 'row', alignItems: 'center' },
});
