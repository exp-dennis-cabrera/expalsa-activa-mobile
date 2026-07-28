import { getApiClient } from './client';

export interface UserSettings {
  emailNotified: boolean;
  emailUpdatesForWorkOrders: boolean;
  emailUpdatesForRequests: boolean;
  statsForAssignedWorkOrders: boolean;
}

export interface MobileOverview {
  open: number;
  onHold: number;
  inProgress: number;
  complete: number;
  today: number;
  high: number;
}

export const meApi = {
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
  getUnreadNotificationCount: async (): Promise<number> => {
    const client = await getApiClient();
    const { data } = await client.get('/notifications/unread-count');
    return data.count ?? 0;
  },
};
