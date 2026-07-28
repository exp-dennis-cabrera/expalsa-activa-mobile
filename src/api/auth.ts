import { getApiClient } from './client';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const client = await getApiClient();
    const { data } = await client.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },
};
