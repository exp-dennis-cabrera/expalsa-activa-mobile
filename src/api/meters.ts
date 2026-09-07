import { getApiClient } from './client';

export interface MeterReading {
  id: number;
  value: number;
  createdByName: string | null;
  readingDate: string;
}

export interface Meter {
  id: number;
  name: string;
  unit: string | null;
  updateFrequencyDays: number;
  lastReading: number | null;
  lastReadingDate: string | null;
  nextReadingDue: string | null;
  pastDue: boolean;
  /** AL_DIA | PENDIENTE | INCUMPLIDO -- estado de la lectura del turno. */
  readingStatus: 'AL_DIA' | 'PENDIENTE' | 'INCUMPLIDO';
  assetId: number | null;
  assetName: string | null;
  locationId: number | null;
  locationName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  createdById: number | null;
  createdByName: string | null;
  assignedUserIds: number[];
  assignedUserNames: string[];
  readings: MeterReading[];
  imageUrl: string | null;
}

export interface MeterTrigger {
  id: number;
  name: string;
  condition: 'MORE_THAN' | 'LESS_THAN';
  value: number;
  workOrderTitle: string;
}

export interface CreateMeterPayload {
  name: string;
  unit?: string;
  updateFrequencyDays: number;
  categoryId?: number;
  locationId?: number;
  assignedUserIds?: number[];
}

export const metersApi = {
  list: async (): Promise<Meter[]> => {
    const client = await getApiClient();
    const { data } = await client.get('/meters');
    return data;
  },
  getById: async (id: number): Promise<Meter> => {
    const client = await getApiClient();
    const { data } = await client.get(`/meters/${id}`);
    return data;
  },
  create: async (assetId: number, payload: CreateMeterPayload): Promise<Meter> => {
    const client = await getApiClient();
    const { data } = await client.post('/meters', payload, { params: { assetId } });
    return data;
  },
  update: async (id: number, payload: CreateMeterPayload): Promise<Meter> => {
    const client = await getApiClient();
    const { data } = await client.patch(`/meters/${id}`, payload);
    return data;
  },
  mini: async (): Promise<{ id: number; name: string }[]> => {
    const client = await getApiClient();
    const { data } = await client.get('/meters/mini');
    return data;
  },
  byAsset: async (assetId: number): Promise<Meter[]> => {
    const client = await getApiClient();
    const { data } = await client.get(`/meters/asset/${assetId}`);
    return data;
  },
  search: async (criteria: { search?: string; assetId?: number; locationId?: number; pastDueOnly?: boolean }): Promise<Meter[]> => {
    const client = await getApiClient();
    const { data } = await client.post('/meters/search', criteria);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    const client = await getApiClient();
    await client.delete(`/meters/${id}`);
  },
  addReading: async (meterId: number, value: number): Promise<Meter> => {
    const client = await getApiClient();
    const { data } = await client.post(`/assets/meters/${meterId}/readings`, { value });
    return data;
  },
  updateReading: async (readingId: number, value: number): Promise<Meter> => {
    const client = await getApiClient();
    const { data } = await client.put(`/meters/readings/${readingId}`, { value });
    return data;
  },
  deleteReading: async (readingId: number): Promise<void> => {
    const client = await getApiClient();
    await client.delete(`/meters/readings/${readingId}`);
  },
  getTriggers: async (meterId: number): Promise<MeterTrigger[]> => {
    const client = await getApiClient();
    const { data } = await client.get(`/assets/meters/${meterId}/triggers`);
    return data;
  },
  uploadImage: async (meterId: number, file: { uri: string; name: string; mimeType: string }): Promise<Meter> => {
    const client = await getApiClient();
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);
    const { data } = await client.post(`/meters/${meterId}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },
};
