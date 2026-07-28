import { getApiClient } from './client';

export interface IdName {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  customId: string | null;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  parentLocationId: number | null;
  parentLocationName: string | null;
  assignedUsers: IdName[];
  teams: IdName[];
  vendors: IdName[];
  createdAt: string;
}

export interface CreateLocationPayload {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  parentLocationId?: number;
  assignedUserIds?: number[];
  vendorIds?: number[];
  teamIds?: number[];
}

export interface UploadedFile {
  id: number;
  fileName: string;
  downloadUrl: string;
  contentType: string | null;
}

export const locationsApi = {
  list: async (page = 0, size = 20, search?: string): Promise<{ content: Location[]; totalPages: number }> => {
    const client = await getApiClient();
    const { data } = await client.get('/locations', { params: { page, size, search } });
    return { content: Array.isArray(data?.content) ? data.content : [], totalPages: data?.totalPages ?? 0 };
  },
  hierarchy: async (): Promise<Location[]> => {
    const client = await getApiClient();
    const { data } = await client.get('/locations/hierarchy');
    return Array.isArray(data) ? data : [];
  },
  getById: async (id: number): Promise<Location> => {
    const client = await getApiClient();
    const { data } = await client.get(`/locations/${id}`);
    return data;
  },
  create: async (payload: CreateLocationPayload): Promise<Location> => {
    const client = await getApiClient();
    const { data } = await client.post('/locations', payload);
    return data;
  },
  update: async (id: number, payload: CreateLocationPayload): Promise<Location> => {
    const client = await getApiClient();
    const { data } = await client.put(`/locations/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    const client = await getApiClient();
    await client.delete(`/locations/${id}`);
  },
  uploadFile: async (id: number, file: { uri: string; name: string; mimeType: string }): Promise<UploadedFile> => {
    const client = await getApiClient();
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);
    const { data } = await client.post(`/locations/${id}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },
};
