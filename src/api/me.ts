import { getApiClient } from './client';

export interface UserSettings {
  emailNotified: boolean;
  emailUpdatesForWorkOrders: boolean;
  emailUpdatesForRequests: boolean;
  statsForAssignedWorkOrders: boolean;
}

/** Igual que MobileWOStatsExtended real: los 4 numeros de la pantalla de estadisticas. */
export interface MobileStatsExtended {
  complete: number;
  completeWeek: number;
  compliantRate: number;
  compliantRateWeek: number;
}

export interface MobileOverview {
  open: number;
  onHold: number;
  inProgress: number;
  complete: number;
  today: number;
  high: number;
}

export type PermissionEntity =
  | 'PEOPLE_AND_TEAMS'
  | 'CATEGORIES'
  | 'CATEGORIES_WEB'
  | 'WORK_ORDERS'
  | 'PREVENTIVE_MAINTENANCES'
  | 'ASSETS'
  | 'PARTS_AND_MULTIPARTS'
  | 'PURCHASE_ORDERS'
  | 'METERS'
  | 'VENDORS_AND_CUSTOMERS'
  | 'FILES'
  | 'LOCATIONS'
  | 'SETTINGS'
  | 'REQUESTS'
  | 'ANALYTICS';

export interface RoleInfo {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  createPermissions: PermissionEntity[];
  viewPermissions: PermissionEntity[];
  viewOtherPermissions: PermissionEntity[];
  editOtherPermissions: PermissionEntity[];
  deleteOtherPermissions: PermissionEntity[];
}

// Igual estructura que UserResponseDTO real: el rol viene anidado
// completo (con sus 5 conjuntos de permisos), no aplanado.
export interface MyProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  avatarUrl: string | null;
  mfaEnabled: boolean;
  role: RoleInfo | null;
}

export const meApi = {
  // Igual que GET /auth/me real -- vive en /auth, no en /users/me.
  getProfile: async (): Promise<MyProfile> => {
    const client = await getApiClient();
    const { data } = await client.get('/auth/me');
    return data;
  },
  // Igual que POST /auth/updatepwd real.
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    const client = await getApiClient();
    await client.post('/auth/updatepwd', { oldPassword, newPassword });
  },
  // Igual que DELETE /auth real.
  deleteAccount: async (): Promise<void> => {
    const client = await getApiClient();
    await client.delete('/auth');
  },
  getSettings: async (): Promise<UserSettings> => {
    const client = await getApiClient();
    const { data } = await client.get('/users/me/settings');
    return data;
  },
  updateSettings: async (patch: Partial<UserSettings>): Promise<UserSettings> => {
    const client = await getApiClient();
    const { data } = await client.patch('/users/me/settings', patch);
    return data;
  },
  getMobileOverview: async (assignedOnly: boolean): Promise<MobileOverview> => {
    const client = await getApiClient();
    const { data } = await client.get('/users/me/mobile-overview', { params: { assignedOnly } });
    return data;
  },
  getMobileExtendedStats: async (): Promise<MobileStatsExtended> => {
    const client = await getApiClient();
    const { data } = await client.get('/users/me/mobile/complete-compliant');
    return data;
  },
  getUnreadNotificationCount: async (): Promise<number> => {
    const client = await getApiClient();
    const { data } = await client.get('/notifications/unread-count');
    return data.count ?? 0;
  },
};
