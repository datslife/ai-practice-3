import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { saveToken, clearToken } from '../storage/authStorage';
import { connect, disconnect } from '../socket/socketClient';
import { AuthUser, AuthResponse } from '../types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

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

  return { user, login, register, logout };
}
