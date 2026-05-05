jest.mock('../../src/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@react-navigation/stack', () => ({
  useNavigation: jest.fn(() => ({ replace: jest.fn() })),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../src/screens/ProfileScreen';
import { useAuth } from '../../src/hooks/useAuth';

describe('ProfileScreen', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u1', name: 'Alice', email: 'alice@test.com' },
      logout: mockLogout,
    });
  });

  it('renders user name and email', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('alice@test.com')).toBeTruthy();
  });

  it('calls logout when Sign Out pressed', async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    const { getByText } = render(<ProfileScreen />);
    fireEvent.press(getByText('Sign Out'));
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
  });
});
