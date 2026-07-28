import { getApiClient } from './client';

export interface IdName {
  id: number;
  name: string;
}

export interface UserSummary {
  id: number;
  fullName: string;
  email: string;
}

async function listSimple<T>(path: string): Promise<T[]> {
  const client = await getApiClient();
  const { data } = await client.get(path);
  return data.content ?? data;
}

export const lookupsApi = {
  assets: () => listSimple<IdName & { locationId?: number }>('/assets?size=100'),
  locations: () => listSimple<IdName>('/locations'),
  categories: (type: string = 'WORK_ORDER') => listSimple<IdName>(`/categories?type=${type}`),
  users: () => listSimple<UserSummary>('/users'),
  teams: () => listSimple<IdName>('/teams'),
  vendors: () => listSimple<IdName>('/vendors'),
  parts: () => listSimple<IdName>('/parts'),
};
