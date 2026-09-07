import { getApiClient } from './client';

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export const categoriesApi = {
  /** type: WORK_ORDER | METER | ASSET ... */
  list: async (type = 'WORK_ORDER'): Promise<Category[]> => {
    const client = await getApiClient();
    const { data } = await client.get('/categories', { params: { type } });
    return data ?? [];
  },
};
