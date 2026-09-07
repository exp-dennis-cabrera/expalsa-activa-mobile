import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { authApi } from '../api/auth';
import { clearTokens, getStoredTokens, setSessionExpiredHandler, storeTokens } from '../api/client';
import { decodeJwtPayload } from '../utils/jwt';
import { meApi, type PermissionEntity } from '../api/me';
import { checkPushNotificationState, registerForPushNotificationsAsync, savePushToken } from '../api/push';

interface EditableRecord {
  createdById?: number | null;
  assignedUserIds?: number[];
}

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: number | null;
  roleName: string | null;
  isRequester: boolean;
  perfilCargado: boolean;
  // Copia fiel de las 5 funciones reales de AuthContext.tsx (hasViewPermission,
  // hasViewOtherPermission, hasCreatePermission, hasEditPermission, hasDeletePermission).
  hasViewPermission: (entity: PermissionEntity) => boolean;
  hasViewOtherPermission: (entity: PermissionEntity) => boolean;
  hasCreatePermission: (entity: PermissionEntity) => boolean;
  hasEditPermission: (entity: PermissionEntity, record: EditableRecord | null | undefined) => boolean;
  hasDeletePermission: (entity: PermissionEntity, record: EditableRecord | null | undefined) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  // true = el usuario fue enviado a los ajustes del sistema a habilitar
  // notificaciones; al volver a la app se reintenta el registro.
  const [esperandoAjustes, setEsperandoAjustes] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);
  /** false si no se pudo leer el perfil (sin el, no hay permisos y todo se ve vacio). */
  const [perfilCargado, setPerfilCargado] = useState(true);
  const [createPermissions, setCreatePermissions] = useState<PermissionEntity[]>([]);
  const [viewPermissions, setViewPermissions] = useState<PermissionEntity[]>([]);
  const [viewOtherPermissions, setViewOtherPermissions] = useState<PermissionEntity[]>([]);
  const [editOtherPermissions, setEditOtherPermissions] = useState<PermissionEntity[]>([]);
  const [deleteOtherPermissions, setDeleteOtherPermissions] = useState<PermissionEntity[]>([]);

  async function applyToken(accessToken: string | null) {
    setIsAuthenticated(!!accessToken);
    if (accessToken) {
      const payload = decodeJwtPayload(accessToken);
      setUserId(payload?.sub ? Number(payload.sub) : null);
      try {
        const profile = await meApi.getProfile();
        setPerfilCargado(true);
        setRoleName(profile.role?.name ?? null);
        setCreatePermissions(profile.role?.createPermissions ?? []);
        setViewPermissions(profile.role?.viewPermissions ?? []);
        setViewOtherPermissions(profile.role?.viewOtherPermissions ?? []);
        setEditOtherPermissions(profile.role?.editOtherPermissions ?? []);
        setDeleteOtherPermissions(profile.role?.deleteOtherPermissions ?? []);
      } catch {
        // Igual que el real (AuthContext.tsx, catch del INITIALIZE): si no
        // se puede leer el perfil, se cierra la sesion en vez de quedar
        // autenticado sin permisos. Sin perfil no hay permisos, y sin
        // permisos las pantallas quedarian vacias sin explicacion --
        // volver al login es mas claro y ademas fuerza a renovar la sesion.
        setPerfilCargado(false);
        setRoleName(null);
        await clearTokens();
        setIsAuthenticated(false);
      }
    } else {
      setUserId(null);
      setRoleName(null);
      setCreatePermissions([]);
      setViewPermissions([]);
      setViewOtherPermissions([]);
      setEditOtherPermissions([]);
      setDeleteOtherPermissions([]);
    }
  }

  useEffect(() => {
    setSessionExpiredHandler(() => applyToken(null));
    getStoredTokens().then(({ accessToken }) => {
      applyToken(accessToken ?? null).finally(() => {
        setIsLoading(false);
        // Igual que setupUser real: el registro del token push ocurre
        // tambien al RESTAURAR la sesion, no solo al iniciarla. Quien deja
        // la sesion abierta nunca pasa por login() y, sin esto, jamas
        // registraria su dispositivo.
        if (accessToken) {
          checkPushNotificationState().then((abrioAjustes) => {
            if (abrioAjustes) setEsperandoAjustes(true);
          });
        }
      });
    });
  }, []);

  /**
   * Copia del listener de AppState real: si el usuario fue a los ajustes
   * del sistema a habilitar las notificaciones, al volver a la app se
   * reintenta el registro. Sin esto habria que cerrar sesion para que
   * tomara efecto.
   */
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active' && esperandoAjustes) {
        setEsperandoAjustes(false);
        registerForPushNotificationsAsync().then(savePushToken);
      }
    });
    return () => sub.remove();
  }, [esperandoAjustes]);

  async function login(email: string, password: string) {
    const { accessToken, refreshToken } = await authApi.login(email, password);
    await storeTokens(accessToken, refreshToken);
    await applyToken(accessToken);
    // Igual que checkPushNotificationState real: al iniciar sesion se pide
    // permiso de notificaciones y se registra el token de este dispositivo.
    checkPushNotificationState().then((abrioAjustes) => {
      if (abrioAjustes) setEsperandoAjustes(true);
    });
  }

  async function logout() {
    await clearTokens();
    await applyToken(null);
  }

  const hasViewPermission = (entity: PermissionEntity) => viewPermissions.includes(entity);
  const hasViewOtherPermission = (entity: PermissionEntity) => viewOtherPermissions.includes(entity);
  const hasCreatePermission = (entity: PermissionEntity) => createPermissions.includes(entity);

  // Igual regla exacta que el real: dueño del registro, o el rol tiene
  // editOtherPermissions para esa entidad, o estoy asignado a ese registro.
  const hasEditPermission = (entity: PermissionEntity, record: EditableRecord | null | undefined) => {
    if (!record) return false;
    if (userId != null && record.createdById === userId) return true;
    if (editOtherPermissions.includes(entity)) return true;
    return !!record.assignedUserIds && userId != null && record.assignedUserIds.includes(userId);
  };

  const hasDeletePermission = (entity: PermissionEntity, record: EditableRecord | null | undefined) => {
    if (!record) return false;
    if (userId != null && record.createdById === userId) return true;
    return deleteOtherPermissions.includes(entity);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        userId,
        roleName,
        isRequester: roleName === 'REQUESTER',
        perfilCargado,
        hasViewPermission,
        hasViewOtherPermission,
        hasCreatePermission,
        hasEditPermission,
        hasDeletePermission,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
