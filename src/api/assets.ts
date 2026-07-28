import { getApiClient } from './client';

export type AssetStatus = 'OPERATIONAL' | 'MODERNIZATION' | 'DOWN' | 'STANDBY' | 'INSPECTION_SCHEDULED' | 'COMMISSIONING' | 'EMERGENCY_SHUTDOWN';

export interface IdName {
  id: number;
  name: string;
}

export interface Asset {
  id: number;
  customId: string | null;
  name: string;
  description: string | null;
  status: AssetStatus;
  categoryId: number | null;
  categoryName: string | null;
  serialNumber: string | null;
  model: string | null;
  manufacturer: string | null;
  power: string | null;
  area: string | null;
  barCode: string | null;
  nfcId: string | null;
  acquisitionDate: string | null;
  acquisitionCost: number | null;
  warrantyExpirationDate: string | null;
  inServiceDate: string | null;
  additionalInfos: string | null;
  imageUrl: string | null;
  locationId: number | null;
  locationName: string | null;
  parentAssetId: number | null;
  parentAssetName: string | null;
  primaryUserId: number | null;
  primaryUserName: string | null;
  assignedUsers: IdName[];
  teams: IdName[];
  vendors: IdName[];
  parts: IdName[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetPayload {
  name: string;
  description?: string;
  status?: AssetStatus;
  categoryId?: number;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  power?: string;
  area?: string;
  barCode?: string;
  nfcId?: string;
  warrantyExpirationDate?: string;
  inServiceDate?: string;
  additionalInfos?: string;
  locationId?: number;
  parentAssetId?: number;
  primaryUserId?: number;
  assignedUserIds?: number[];
  teamIds?: number[];
  vendorIds?: number[];
  partIds?: number[];
}

export const assetsApi = {
  list: async (page = 0, size = 20, search?: string): Promise<{ content: Asset[]; totalPages: number }> => {
    const client = await getApiClient();
    const { data } = await client.get('/assets', { params: { page, size, search } });
    return data;
  },
  hierarchy: async (): Promise<Asset[]> => {
    const client = await getApiClient();
    const { data } = await client.get('/assets/hierarchy');
    return data;
  },
  getById: async (id: number): Promise<Asset> => {
    const client = await getApiClient();
    const { data } = await client.get(`/assets/${id}`);
    return data;
  },
  getByBarcode: async (code: string): Promise<Asset> => {
    const client = await getApiClient();
    const { data } = await client.get(`/assets/by-barcode/${encodeURIComponent(code)}`);
    return data;
  },
  getByNfc: async (code: string): Promise<Asset> => {
    const client = await getApiClient();
    const { data } = await client.get(`/assets/by-nfc/${encodeURIComponent(code)}`);
    return data;
  },
  create: async (payload: CreateAssetPayload): Promise<Asset> => {
    const client = await getApiClient();
    const { data } = await client.post('/assets', payload);
    return data;
  },
  update: async (id: number, payload: CreateAssetPayload): Promise<Asset> => {
    const client = await getApiClient();
    const { data } = await client.put(`/assets/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    const client = await getApiClient();
    await client.delete(`/assets/${id}`);
  },
  uploadImage: async (id: number, file: { uri: string; name: string; mimeType: string }): Promise<Asset> => {
    const client = await getApiClient();
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);
    const { data } = await client.post(`/assets/${id}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },
};
