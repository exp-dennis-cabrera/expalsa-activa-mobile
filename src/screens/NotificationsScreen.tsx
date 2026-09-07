import { useCallback, useLayoutEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { List, Text, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { notificationsApi, type AppNotification, type NotificationType } from '../api/notifications';

/**
 * Copia fiel de NotificationsScreen real: lista con icono por tipo, las no
 * leidas resaltadas, scroll infinito, y "Marcar todas como vistas" en el
 * encabezado (solo si hay alguna sin leer).
 */

// Copia exacta de notificationIcons real.
const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  ASSET: 'package-variant-closed',
  LOCATION: 'map-marker-outline',
  METER: 'gauge',
  // Reloj de alerta: distingue el aviso de lecturas vencidas del
  // medidor normal.
  METER_READING_OVERDUE: 'clock-alert-outline',
  PART: 'archive-outline',
  REQUEST: 'inbox-arrow-down-outline',
  TEAM: 'account-outline',
  WORK_ORDER: 'clipboard-text-outline',
  INFO: 'information',
  PURCHASE_ORDER: 'comma-circle-outline',
};

/** Igual que getNotificationUrl real: a que pantalla lleva cada tipo. */
function getNotificationRoute(type: NotificationType, id: number | null): { route: string; params: object } | null {
  // El aviso de lecturas pendientes lleva al LISTADO con el filtro ya
  // activo, no al detalle de un medidor. Por eso se evalua antes de la
  // comprobacion de id: no apunta a ningun recurso concreto.
  if (type === 'METER_READING_OVERDUE') {
    return { route: 'Meters', params: { soloVencidos: true } };
  }
  if (id == null) return null;
  switch (type) {
    case 'WORK_ORDER':
      return { route: 'WorkOrderDetail', params: { id } };
    case 'REQUEST':
      return { route: 'RequestDetail', params: { id } };
    case 'ASSET':
      return { route: 'AssetDetail', params: { id } };
    case 'METER':
      return { route: 'MeterDetail', params: { id } };
    case 'LOCATION':
      return { route: 'LocationDetail', params: { id } };
    default:
      return null;
  }
}

function isCloseToBottom({ layoutMeasurement, contentOffset, contentSize }: any): boolean {
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
}

export default function NotificationsScreen({ navigation }: any) {
  const theme = useTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [lastPage, setLastPage] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    notificationsApi
      .list(0)
      .then((r) => {
        setNotifications(r.content);
        setLastPage(r.last);
        setPage(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  async function loadMore() {
    if (loading || lastPage) return;
    setLoading(true);
    try {
      const r = await notificationsApi.list(page + 1);
      setNotifications((prev) => [...prev, ...r.content]);
      setLastPage(r.last);
      setPage((p) => p + 1);
    } catch {
      // sin ruido: si falla, simplemente no se agregan mas
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllAsRead() {
    await notificationsApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  }

  // Igual que el real: "Marcar todas como vistas" solo aparece si hay alguna sin leer.
  const haySinLeer = notifications.some((n) => !n.seen);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        haySinLeer ? (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={{ color: theme.colors.primary, marginRight: 12 }} variant="titleMedium">
              Marcar todas como vistas
            </Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, haySinLeer, theme]);

  async function onReadNotification(notification: AppNotification) {
    const target = getNotificationRoute(notification.notificationType, notification.resourceId);
    if (!notification.seen) {
      await notificationsApi.markAsRead(notification.id);
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, seen: true } : n)));
    }
    if (target) navigation.navigate(target.route, target.params);
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} colors={[theme.colors.primary]} onRefresh={load} />}
      onScroll={({ nativeEvent }) => {
        if (isCloseToBottom(nativeEvent)) loadMore();
      }}
      scrollEventThrottle={400}
    >
      {notifications.length > 0 ? (
        <List.Section>
          {notifications.map((notification) => (
            <List.Item
              key={notification.id}
              title={notification.title}
              titleNumberOfLines={2}
              description={`${notification.message ? notification.message + '\n' : ''}${new Date(
                notification.createdAt,
              ).toLocaleString()}`}
              descriptionNumberOfLines={3}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={NOTIFICATION_ICONS[notification.notificationType] ?? NOTIFICATION_ICONS.INFO}
                  color={notification.seen ? 'black' : theme.colors.primary}
                />
              )}
              style={{ backgroundColor: notification.seen ? 'white' : theme.colors.background }}
              onPress={() => onReadNotification(notification)}
            />
          ))}
        </List.Section>
      ) : (
        <View style={styles.empty}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
            Sin notificaciones
          </Text>
          <Text variant="bodyMedium">Aquí verás los avisos sobre tus órdenes, activos y solicitudes.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { backgroundColor: 'white', padding: 20, alignItems: 'center', borderRadius: 10, margin: 12 },
});
