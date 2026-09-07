import { getApiClient } from './client';
import type { WorkOrderPriority, WorkOrderType } from './workOrders';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'CANCELLED';

export interface RequestItem {
  id: number;
  customId: string | null;
  title: string;
  description: string | null;
  priority: WorkOrderPriority;
  type: WorkOrderType | null;
  categoryId: number | null;
  categoryName: string | null;
  assetId: number | null;
  assetName: string | null;
  locationId: number | null;
  locationName: string | null;
  teamId: number | null;
  teamName: string | null;
  dueDate: string | null;
  estimatedDurationMinutes: number | null;
  estimatedStartDate: string | null;
  createdById: number | null;
  createdByName: string | null;
  contact: string | null;
  status: RequestStatus;
  cancelled: boolean;
  cancellationReason: string | null;
  workOrderId: number | null;
  createdAt: string;
}

export interface CreateRequestPayload {
  title: string;
  description?: string;
  priority?: WorkOrderPriority;
  type?: WorkOrderType;
  categoryId?: number;
  assetId?: number;
  locationId?: number;
  teamId?: number;
  dueDate?: string;
  estimatedDurationMinutes?: number;
  estimatedStartDate?: string;
  contact?: string;
}

export const requestsApi = {
  list: async (): Promise<RequestItem[]> => {
    const client = await getApiClient();
    const { data } = await client.get('/requests');
    return Array.isArray(data) ? data : [];
  },
  pendingCount: async (): Promise<number> => {
    const client = await getApiClient();
    const { data } = await client.get('/requests/pending-count');
    return data?.count ?? 0;
  },
  getById: async (id: number): Promise<RequestItem> => {
    const client = await getApiClient();
    const { data } = await client.get(`/requests/${id}`);
    return data;
  },
  create: async (payload: CreateRequestPayload): Promise<RequestItem> => {
    const client = await getApiClient();
    const { data } = await client.post('/requests', payload);
    return data;
  },
  update: async (id: number, payload: CreateRequestPayload): Promise<RequestItem> => {
    const client = await getApiClient();
    const { data } = await client.patch(`/requests/${id}`, payload);
    return data;
  },
  approve: async (id: number, primaryAssigneeId?: number): Promise<{ id: number }> => {
    const client = await getApiClient();
    const { data } = await client.patch(`/requests/${id}/approve`, { primaryAssigneeId });
    return data;
  },
  cancel: async (id: number, reason: string): Promise<RequestItem> => {
    const client = await getApiClient();
    const { data } = await client.patch(`/requests/${id}/cancel`, { reason });
    return data;
  },
  delete: async (id: number): Promise<void> => {
    const client = await getApiClient();
    await client.delete(`/requests/${id}`);
  },
};
