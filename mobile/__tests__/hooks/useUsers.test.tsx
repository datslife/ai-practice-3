jest.mock('../../src/api/client', () => ({
  apiClient: { get: jest.fn() },
}));

jest.mock('../../src/socket/socketClient', () => ({
  getSocket: jest.fn(),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useUsers } from '../../src/hooks/useUsers';
import { apiClient } from '../../src/api/client';
import { getSocket } from '../../src/socket/socketClient';

const mockUsersRaw = [
  { id: 'u1', email: 'bob@test.com', name: 'Bob', online: false, created_at: '' },
];

describe('useUsers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches users on mount', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { users: mockUsersRaw } });
    (getSocket as jest.Mock).mockReturnValue({ on: jest.fn(), off: jest.fn() });
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.users.length).toBe(1));
    expect(result.current.users[0].name).toBe('Bob');
    expect(result.current.users[0].status).toBe('offline');
  });

  it('updates presence on presence:update event', async () => {
    let presenceHandler: (data: { userId: string; status: string }) => void;
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { users: mockUsersRaw } });
    (getSocket as jest.Mock).mockReturnValue({
      on: (event: string, handler: typeof presenceHandler) => {
        if (event === 'presence:update') presenceHandler = handler;
      },
      off: jest.fn(),
    });
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.users.length).toBe(1));
    act(() => { presenceHandler({ userId: 'u1', status: 'online' }); });
    expect(result.current.users[0].status).toBe('online');
  });

  it('filters users by search query', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { users: [
        { id: 'u1', name: 'Alice', online: false, email: '', created_at: '' },
        { id: 'u2', name: 'Bob', online: false, email: '', created_at: '' },
      ]},
    });
    (getSocket as jest.Mock).mockReturnValue({ on: jest.fn(), off: jest.fn() });
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.users.length).toBe(2));
    act(() => { result.current.setSearch('ali'); });
    expect(result.current.filteredUsers.length).toBe(1);
    expect(result.current.filteredUsers[0].name).toBe('Alice');
  });
});
