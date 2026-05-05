/**
 * @format
 */

jest.mock('../src/storage/authStorage', () => ({
  getToken: jest.fn().mockResolvedValue(null),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  useRoute: jest.fn(() => ({ params: {} })),
  RouteProp: jest.fn(),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: jest.fn(() => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: () => null,
  })),
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), replace: jest.fn() })),
  StackNavigationProp: jest.fn(),
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ login: jest.fn(), register: jest.fn(), user: null, logout: jest.fn() })),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
