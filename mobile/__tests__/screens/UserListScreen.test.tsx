jest.mock('../../src/hooks/useUsers', () => ({ useUsers: jest.fn() }));
jest.mock('@react-navigation/stack', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UserListScreen from '../../src/screens/UserListScreen';
import { useUsers } from '../../src/hooks/useUsers';

const mockUsers = [
  { id: 'u1', name: 'Alice', email: 'a@test.com', status: 'online', created_at: '' },
  { id: 'u2', name: 'Bob', email: 'b@test.com', status: 'offline', created_at: '' },
];

describe('UserListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useUsers as jest.Mock).mockReturnValue({
      filteredUsers: mockUsers,
      search: '',
      setSearch: jest.fn(),
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders user names', () => {
    const { getByText } = render(<UserListScreen />);
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('shows online status dot for online user', () => {
    const { getAllByTestId } = render(<UserListScreen />);
    const dots = getAllByTestId('presence-dot');
    expect(dots.length).toBe(2);
  });

  it('shows search bar', () => {
    const { getByPlaceholderText } = render(<UserListScreen />);
    expect(getByPlaceholderText('Search users...')).toBeTruthy();
  });

  it('shows error state with retry', () => {
    (useUsers as jest.Mock).mockReturnValue({
      filteredUsers: [],
      search: '',
      setSearch: jest.fn(),
      loading: false,
      error: 'Failed to load users',
      refetch: jest.fn(),
    });
    const { getByText } = render(<UserListScreen />);
    expect(getByText('Failed to load users')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });
});
