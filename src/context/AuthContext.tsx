import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { clearTokens, getStoredTokens, setSessionExpiredHandler, storeTokens } from '../api/client';
import { decodeJwtPayload } from '../utils/jwt';

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  userId: number | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  function applyToken(accessToken: string | null) {
    setIsAuthenticated(!!accessToken);
    if (accessToken) {
      const payload = decodeJwtPayload(accessToken);
      setUserId(payload?.sub ? Number(payload.sub) : null);
    } else {
      setUserId(null);
    }
  }

  useEffect(() => {
    // Si el token vence y no se puede renovar, esto nos devuelve al login.
    setSessionExpiredHandler(() => applyToken(null));

    getStoredTokens().then(({ accessToken }) => {
      applyToken(accessToken ?? null);
      setIsLoading(false);
    });
  }, []);

  async function login(email: string, password: string) {
    const { accessToken, refreshToken } = await authApi.login(email, password);
    await storeTokens(accessToken, refreshToken);
    applyToken(accessToken);
  }

  async function logout() {
    await clearTokens();
    applyToken(null);
  }

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
