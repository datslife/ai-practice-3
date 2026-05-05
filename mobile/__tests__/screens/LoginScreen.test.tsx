jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@react-navigation/stack', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), replace: jest.fn() })),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import { useAuth } from '../../src/hooks/useAuth';

describe('LoginScreen', () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ login: mockLogin });
    require('@react-navigation/stack').useNavigation.mockReturnValue({ navigate: mockNavigate, replace: mockNavigate });
  });

  it('renders email, password inputs and Sign In button', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('calls login with entered credentials', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'alice@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('alice@test.com', 'secret'));
  });

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce({ response: { status: 401 } });
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'x@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrong');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => expect(getByText('Invalid email or password')).toBeTruthy());
  });
});
