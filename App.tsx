import { useEffect, useRef } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SystemBars } from 'react-native-edge-to-edge';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { navigate } from './src/navigation/navigationRef';
import { theme } from './src/theme';

// Igual que el real: define como se comporta una notificacion que llega
// con la app abierta -- se muestra el aviso y suena.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Igual que getNotificationUrl real: segun el tipo de recurso de la
 * notificacion, a que pantalla del celular hay que llevar al usuario.
 */
function getNotificationRoute(type: string, id: number): { route: string; params?: object } | null {
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

export default function App() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Notificacion recibida con la app abierta.
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // El aviso lo muestra el sistema (ver setNotificationHandler arriba).
    });

    // El usuario TOCO la notificacion -- hay que llevarlo al recurso.
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string; id?: number };
      if (!data?.type || data.id == null) return;
      const target = getNotificationRoute(data.type, data.id);
      if (target) navigate(target.route, target.params);
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <SystemBars style="dark" />
          <RootNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
