import { Alert, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { getApiClient } from './client';

/**
 * Copia fiel de registerForPushNotificationsAsync real: pide permiso, y si
 * el usuario acepta, obtiene el token de Expo de este dispositivo. Solo
 * funciona en un celular real -- en el emulador no hay push.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    // En emulador no hay notificaciones push; no es un error, simplemente no aplica.
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Igual que el real: Android necesita un "canal" declarado para poder
  // mostrar notificaciones con prioridad alta, vibracion y luz.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5b6df8',
    });
  }

  const projectId =
    (Constants?.expoConfig?.extra as any)?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}

/** Igual que savePushToken real: manda el token al backend para que pueda avisarnos. */
export async function savePushToken(token: string | null): Promise<void> {
  if (!token) return;
  try {
    const client = await getApiClient();
    await client.post('/notifications/push-token', { token });
  } catch {
    // Silencioso: si falla, el usuario simplemente no recibe push --
    // no tiene sentido interrumpirle el uso de la app por esto.
  }
}

/**
 * Se llama al iniciar sesion: pide permiso, obtiene el token y lo registra.
 *
 * Nunca lanza: las notificaciones push son un extra, y si fallan no deben
 * afectar el inicio de sesion. En Expo Go (SDK 53+) esto SIEMPRE falla
 * porque Android quito el soporte de push remoto de esa app -- es esperado
 * y no significa que algo este roto: al compilar con EAS funciona.
 */
/**
 * Copia fiel de checkPushNotificationState real (AuthContext.tsx del movil
 * de Atlas CMMS).
 *
 * Si el permiso ya esta concedido, registra el token. Si no, lo pide; y si
 * el usuario lo deniega, ofrece abrir los ajustes del sistema -- porque
 * Android no vuelve a preguntar una vez rechazado.
 *
 * Devuelve true si el usuario fue enviado a Ajustes, para que quien llame
 * pueda reintentar el registro cuando la app vuelva a primer plano.
 */
export async function checkPushNotificationState(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        const token = await registerForPushNotificationsAsync();
        await savePushToken(token);
        return false;
      }

      // Permiso denegado: Android no vuelve a preguntar, asi que la unica
      // via es que el usuario lo habilite a mano.
      return await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Sin permiso de notificaciones',
          'No podrás recibir avisos de órdenes asignadas ni lecturas pendientes. Puedes habilitarlo desde los ajustes del sistema.',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            {
              text: 'Permitir',
              onPress: () => {
                Linking.openSettings();
                resolve(true);
              },
            },
          ],
          { cancelable: false },
        );
      });
    }

    // El permiso ya estaba concedido.
    const token = await registerForPushNotificationsAsync();
    await savePushToken(token);
    return false;
  } catch {
    // Sin push la app sigue funcionando; no tiene sentido interrumpir.
    return false;
  }
}
