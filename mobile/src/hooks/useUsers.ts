import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../api/client';
import { getSocket } from '../socket/socketClient';
import { User, PresenceUpdate } from '../types';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<{ users: Array<Omit<User, 'status'> & { online: boolean }> }>('/users');
      setUsers(data.users.map((u) => ({ ...u, status: u.online ? 'online' as const : 'offline' as const })));
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handlePresence = ({ userId, status }: PresenceUpdate) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u))
      );
    };
    socket.on('presence:update', handlePresence);
    return () => { socket.off('presence:update', handlePresence); };
  });

  const filteredUsers = useMemo(
    () =>
      search.trim()
        ? users.filter((u) =>
            u.name.toLowerCase().includes(search.toLowerCase())
          )
        : users,
    [users, search]
  );

  return { users, filteredUsers, search, setSearch, loading, error, refetch: fetchUsers };
}
