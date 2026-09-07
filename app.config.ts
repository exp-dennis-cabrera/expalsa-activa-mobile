import { ExpoConfig, ConfigContext } from 'expo/config';
import fs from 'fs';
import path from 'path';

/**
 * Credenciales de Firebase para notificaciones push.
 *
 * El archivo vive en la RAIZ del proyecto, no en android/: EAS borra y
 * recrea esa carpeta al hacer prebuild ("The android project is malformed,
 * project files will be cleared"), asi que cualquier cosa que se escriba
 * ahi antes se pierde.
 *
 * Si existe GOOGLE_SERVICES_BASE64 se reconstruye desde ahi -- util cuando
 * el archivo no esta versionado. Si no, se usa el que ya esta en el
 * proyecto.
 */
const rutaGoogleServices = path.resolve(__dirname, 'google-services.json');
if (process.env.GOOGLE_SERVICES_BASE64) {
  fs.writeFileSync(
    rutaGoogleServices,
    Buffer.from(process.env.GOOGLE_SERVICES_BASE64, 'base64').toString('utf-8'),
  );
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Expalsa Activa',
  slug: 'expalsa-activa',
  scheme: 'expalsa-activa',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#101B67',
  },
  android: {
    package: 'com.expalsa.activa',
    edgeToEdgeEnabled: true,
    /**
     * Credenciales de Firebase Cloud Messaging. Sin este archivo, Android
     * NO entrega notificaciones push: getExpoPushTokenAsync() falla y el
     * dispositivo nunca registra su token.
     *
     * Mismo mecanismo que googleServicesFile en el app.config.ts real.
     */
    googleServicesFile: rutaGoogleServices,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#101B67',
    },
    permissions: ['CAMERA', 'NFC'],
  },
  ios: {
    bundleIdentifier: 'com.expalsa.activa',
    supportsTablet: true,
  },
  plugins: [
    'expo-camera',
    'expo-image-picker',
    'react-native-nfc-manager',
    [
      'expo-notifications',
      {
        // Android ignora los colores del icono de notificacion y usa solo
        // su silueta, pintada de blanco. Por eso este archivo es la forma
        // del simbolo EA en blanco con fondo transparente.
        icon: './assets/notification-icon.png',
        // Color de acento de la notificacion: el rojo de la marca.
        color: '#CC0005',
      },
    ],
  ],
  extra: {
    // URL por defecto del backend. El usuario puede sobreescribirla desde
    // la pantalla "Servidor" (ver CustomServerScreen) -- igual patron que
    // el real, para que cada instalacion apunte a su propio backend.
    DEFAULT_API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.expalsa-activa.com',
    eas: {
      projectId: 'c79f49bb-8c60-4d86-87fa-0d63683b439f',
    },
  },
});
