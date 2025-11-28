import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest, getProfile } from '../../features/auth/services/authService';

type Usuario = { id: string; nombre: string; email: string; rol: string };

type AuthContextValue = {
  user: Usuario | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'overtime_token';
const REFRESH_TOKEN_STORAGE_KEY = 'overtime_refresh_token';

const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);
const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

const setStoredToken = (token: string | null) => { if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token); else localStorage.removeItem(TOKEN_STORAGE_KEY); };
const setStoredRefreshToken = (token: string | null) => { if (token) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token); else localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY); };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [, setRefreshToken] = useState<string | null>(() => getStoredRefreshToken());

  const handleProfileLoad = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      setUser(profile);
      setError(null);
    } catch (err) {
      console.error(err);
      setUser(null);
      setStoredToken(null);
      setStoredRefreshToken(null);
      setToken(null);
      setRefreshToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (token) void handleProfileLoad(); else setLoading(false); }, [handleProfileLoad, token]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { accessToken, refreshToken: rt, user } = await loginRequest({ email, password });
      setStoredToken(accessToken);
      setStoredRefreshToken(rt);
      setToken(accessToken);
      setRefreshToken(rt ?? null);
      setUser(user);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Credenciales inválidas o servicio no disponible');
      setUser(null);
      setStoredToken(null);
      setStoredRefreshToken(null);
      setToken(null);
      setRefreshToken(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setStoredRefreshToken(null);
    setUser(null);
    setToken(null);
    setRefreshToken(null);
  }, []);

  const refreshProfile = useCallback(async () => { await handleProfileLoad(); }, [handleProfileLoad]);

  const value = useMemo(() => ({ user, loading, error, isAuthenticated: Boolean(user), token, login, logout, refreshProfile }), [user, loading, error, token, login, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
