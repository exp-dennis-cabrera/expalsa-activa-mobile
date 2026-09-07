import { getApiClient } from './client';

export type NotificationType =
  | 'INFO'
  | 'ASSET'
  | 'WORK_ORDER'
  | 'PART'
  | 'METER'
  /** Aviso diario de lecturas no registradas: lleva al listado filtrado. */
  | 'METER_READING_OVERDUE'
  | 'LOCATION'
  | 'TEAM'
  | 'REQUEST'
  | 'PURCHASE_ORDER';

export interface AppNotification {
  id: number;
  notificationType: NotificationType;
  title: string;
  message: string | null;
  resourceId: number | null;
  seen: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: async (page = 0): Promise<{ content: AppNotification[]; last: boolean }> => {
    const client = await getApiClient();
    const { data } = await client.get('/notifications', { params: { page, size: 15 } });
    return { content: data?.content ?? [], last: data?.last ?? true };
  },
  /** Igual que editNotification real: marcar una como vista. */
  markAsRead: async (id: number): Promise<void> => {
    const client = await getApiClient();
    await client.patch(`/notifications/${id}/read`);
  },
  /** Igual que readAllNotifications real. */
  markAllAsRead: async (): Promise<void> => {
    const client = await getApiClient();
    await client.patch('/notifications/read-all');
  },
};
