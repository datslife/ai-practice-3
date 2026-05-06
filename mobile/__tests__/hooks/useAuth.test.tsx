jest.mock('../../src/storage/authStorage', () => ({
  saveToken: jest.fn().mockResolvedValue(undefined),
  getToken: jest.fn().mockResolvedValue(null),
  clearToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/socket/socketClient', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock('../../src/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { apiClient } from '../../src/api/client';
import { saveToken, clearToken } from '../../src/storage/authStorage';
import { connect, disconnect } from '../../src/socket/socketClient';

const mockUser = { id: 'u1', email: 'alice@test.com', name: 'Alice' };
const mockToken = 'jwt-token-here';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with no user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    expect(result.current.user).toBeNull();
  });

  it('login sets user, saves token, connects socket', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: { user: mockUser, token: mockToken },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('alice@test.com', 'secret');
    });
    expect(result.current.user).toEqual(mockUser);
    expect(saveToken).toHaveBeenCalledWith(mockToken);
    expect(connect).toHaveBeenCalledWith(mockToken);
  });

  it('login throws on API error', async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce({ response: { status: 401 } });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await expect(
      act(async () => result.current.login('x@test.com', 'wrong'))
    ).rejects.toBeDefined();
  });

  it('logout clears user, token, and socket', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: { user: mockUser, token: mockToken },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.login('alice@test.com', 'secret'); });
    await act(async () => { await result.current.logout(); });
    expect(result.current.user).toBeNull();
    expect(clearToken).toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
  });
});
