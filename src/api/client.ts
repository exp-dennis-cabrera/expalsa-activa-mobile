import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const ACCESS_TOKEN_KEY = 'expalsa_access_token';
const REFRESH_TOKEN_KEY = 'expalsa_refresh_token';
const CUSTOM_SERVER_KEY = 'expalsa_custom_server_url';

/**
 * Igual patron que la app real: el usuario puede apuntar la app a la URL
 * de SU propio backend (self-hosted), guardada en el dispositivo. Si no
 * eligió una, se usa la URL por defecto del build.
 */
export async function getApiBaseUrl(): Promise<string> {
  const custom = await AsyncStorage.getItem(CUSTOM_SERVER_KEY);
  const url = custom || (Constants.expoConfig?.extra?.DEFAULT_API_URL as string);
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export async function setCustomServerUrl(url: string | null) {
  if (url) await AsyncStorage.setItem(CUSTOM_SERVER_KEY, url);
  else await AsyncStorage.removeItem(CUSTOM_SERVER_KEY);
}

export async function getStoredTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(ACCESS_TOKEN_KEY),
    AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function storeTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
  ]);
}

let client: AxiosInstance | null = null;
let onSessionExpired: (() => void) | null = null;
// Candado compartido: si 5 peticiones reciben 401 casi al mismo tiempo (como
// pasa al abrir el detalle de una orden, que dispara 5 llamadas en paralelo),
// solo la primera debe llamar a /auth/refresh -- las demas esperan esa misma
// promesa en vez de disparar su propio refresh por separado.
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

async function refreshTokens(baseURL: string): Promise<{ accessToken: string; refreshToken: string }> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken } = await getStoredTokens();
      if (!refreshToken) throw new Error('Sin refresh token guardado.');
      const refreshClient = axios.create({ baseURL });
      const { data } = await refreshClient.post('/auth/refresh', { refreshToken });
      await storeTokens(data.accessToken, data.refreshToken);
      return { accessToken: data.accessToken, refreshToken: data.refreshToken };
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Se crea una vez, ya con la URL del backend resuelta (por defecto o la que eligió el usuario). */
export async function getApiClient(): Promise<AxiosInstance> {
  if (client) return client;

  const baseURL = await getApiBaseUrl();
  client = axios.create({ baseURL, timeout: 20000 });

  client.interceptors.request.use(async (config) => {
    const { accessToken } = await getStoredTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  // Si el token expiro (401), intenta renovarlo una vez con el refreshToken
  // antes de rendirse y mandar al usuario de vuelta al login.
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        try {
          const { accessToken } = await refreshTokens(baseURL);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return client!(original);
        } catch {
          await clearTokens();
          onSessionExpired?.();
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

/** Hay que llamar esto despues de que el usuario cambia el servidor, para que tome efecto. */
export function resetApiClient() {
  client = null;
}
