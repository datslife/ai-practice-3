jest.mock('../../src/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@react-navigation/stack', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../../src/screens/RegisterScreen';
import { useAuth } from '../../src/hooks/useAuth';

describe('RegisterScreen', () => {
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ register: mockRegister });
  });

  it('renders name, email, password inputs and Register button', () => {
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    expect(getByPlaceholderText('Name')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
  });

  it('calls register with entered data', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Name'), 'Alice');
    fireEvent.changeText(getByPlaceholderText('Email'), 'alice@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret');
    fireEvent.press(getByText('Register'));
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('alice@test.com', 'Alice', 'secret')
    );
  });

  it('shows error on duplicate email', async () => {
    mockRegister.mockRejectedValueOnce({ response: { status: 409 } });
    const { getByPlaceholderText, getByText } = render(<RegisterScreen />);
    fireEvent.changeText(getByPlaceholderText('Name'), 'Alice');
    fireEvent.changeText(getByPlaceholderText('Email'), 'alice@test.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret');
    fireEvent.press(getByText('Register'));
    await waitFor(() => expect(getByText('Email already in use')).toBeTruthy());
  });
});
