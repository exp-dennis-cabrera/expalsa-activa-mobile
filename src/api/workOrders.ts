import { getApiClient } from './client';

// Codificacion base64 manual -- btoa no esta garantizado en React Native.
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    result += BASE64_CHARS[b1 >> 2];
    result += BASE64_CHARS[((b1 & 3) << 4) | (b2 !== undefined ? b2 >> 4 : 0)];
    result += b2 !== undefined ? BASE64_CHARS[((b2 & 15) << 2) | (b3 !== undefined ? b3 >> 6 : 0)] : '=';
    result += b3 !== undefined ? BASE64_CHARS[b3 & 63] : '=';
  }
  return result;
}

export type WorkOrderStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
export type WorkOrderPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type WorkOrderType = 'CORRECTIVE' | 'PREVENTIVE' | 'INSPECTION';

export interface AssigneeSummary {
  id: number;
  fullName: string;
}

export interface WorkOrder {
  id: number;
  customId: string | null;
  title: string;
  imageUrl: string | null;
  description: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  type: WorkOrderType | null;
  categoryId: number | null;
  categoryName: string | null;
  assetId: number | null;
  assetName: string | null;
  locationId: number | null;
  locationName: string | null;
  createdById: number | null;
  createdByName: string | null;
  vendorId: number | null;
  vendorName: string | null;
  teamId: number | null;
  teamName: string | null;
  primaryAssigneeId: number | null;
  primaryAssigneeName: string | null;
  assignees: AssigneeSummary[];
  dueDate: string | null;
  estimatedStartDate: string | null;
  estimatedDurationMinutes: number | null;
  requiresSignature: boolean | null;
  feedback: string | null;
  signature: string | null;
  completedAt: string | null;
  archived: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
}

export interface CreateWorkOrderPayload {
  title: string;
  description?: string;
  priority?: WorkOrderPriority;
  assetId?: number;
  locationId?: number;
  categoryId?: number;
  dueDate?: string;
  estimatedStartDate?: string;
  estimatedDurationMinutes?: number;
  requiresSignature?: boolean;
  teamId?: number;
  primaryAssigneeId?: number;
  additionalAssigneeIds?: number[];
}

export interface WorkOrderListFilters {
  status?: WorkOrderStatus[];
  priority?: WorkOrderPriority[];
  search?: string;
  assignedToUserId?: number;
}

export interface AdvancedFilters {
  assetIds?: number[];
  categoryIds?: number[];
  teamIds?: number[];
  locationIds?: number[];
  primaryUserIds?: number[];
  additionalWorkerIds?: number[];
  createdByIds?: number[];
  completedByIds?: number[];
  archived?: boolean;
  dueDateBefore?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  completedAtFrom?: string;
  completedAtTo?: string;
}

export const workOrdersApi = {
  list: async (page = 0, size = 20, filters: WorkOrderListFilters = {}): Promise<PageResponse<WorkOrder>> => {
    const client = await getApiClient();
    const { data } = await client.get<PageResponse<WorkOrder>>('/work-orders', {
      params: { page, size, ...filters },
      paramsSerializer: { indexes: null }, // status=A&status=B, no status[0]=A
    });
    return data;
  },
  search: async (page: number, size: number, filters: WorkOrderListFilters & AdvancedFilters): Promise<PageResponse<WorkOrder>> => {
    const client = await getApiClient();
    const { data } = await client.post<PageResponse<WorkOrder>>('/work-orders/search', filters, { params: { page, size } });
    return data;
  },
  getById: async (id: number): Promise<WorkOrder> => {
    const client = await getApiClient();
    const { data } = await client.get<WorkOrder>(`/work-orders/${id}`);
    return data;
  },
  create: async (payload: CreateWorkOrderPayload): Promise<WorkOrder> => {
    const client = await getApiClient();
    const { data } = await client.post<WorkOrder>('/work-orders', payload);
    return data;
  },
  update: async (id: number, payload: CreateWorkOrderPayload): Promise<WorkOrder> => {
    const client = await getApiClient();
    const { data } = await client.put<WorkOrder>(`/work-orders/${id}`, payload);
    return data;
  },
  updateStatus: async (id: number, status: WorkOrderStatus, extra?: { feedback?: string; signature?: string }): Promise<WorkOrder> => {
    const client = await getApiClient();
    const { data } = await client.patch<WorkOrder>(`/work-orders/${id}/status`, { status, ...extra });
    return data;
  },
  archive: async (id: number): Promise<void> => {
    const client = await getApiClient();
    await client.patch(`/work-orders/${id}/archive`);
  },
  delete: async (id: number): Promise<void> => {
    const client = await getApiClient();
    await client.delete(`/work-orders/${id}`);
  },
  downloadReport: async (id: number): Promise<string> => {
    const client = await getApiClient();
    const { data } = await client.get(`/work-orders/${id}/report`, { responseType: 'arraybuffer' });
    return arrayBufferToBase64(data);
  },
};
