import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiClient } from '../api/client';
import { saveToken, getToken, clearToken } from '../storage/authStorage';
import { connect, disconnect } from '../socket/socketClient';
import { AuthUser, AuthResponse } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me');
        connect(token);
        setUser(data.user);
      } catch {
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    await saveToken(data.token);
    connect(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string): Promise<void> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', { email, name, password });
    await saveToken(data.token);
    connect(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    disconnect();
    await clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
