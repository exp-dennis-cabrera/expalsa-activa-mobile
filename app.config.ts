import { ExpoConfig, ConfigContext } from 'expo/config';

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
    backgroundColor: '#ebecf6',
  },
  android: {
    package: 'com.expalsa.activa',
    edgeToEdgeEnabled: true,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ebecf6',
    },
    permissions: ['CAMERA', 'NFC'],
  },
  ios: {
    bundleIdentifier: 'com.expalsa.activa',
    supportsTablet: true,
  },
  plugins: ['expo-camera', 'expo-image-picker', 'react-native-nfc-manager'],
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
