jest.mock('../../src/hooks/useChat', () => ({ useChat: jest.fn() }));
jest.mock('@react-navigation/stack', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
}));
jest.mock('@react-navigation/native', () => ({
  useRoute: jest.fn(),
  RouteProp: jest.fn(),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ChatScreen from '../../src/screens/ChatScreen';
import { useChat } from '../../src/hooks/useChat';
import { useRoute } from '@react-navigation/native';

const mockRecipient = { id: 'u2', name: 'Bob', email: 'b@test.com', status: 'online' as const, created_at: '' };
const mockMessages = [
  { id: 'm1', conversation_id: 'c1', sender_id: 'me', content: 'Hi Bob', read_at: null, created_at: '', status: 'sent' as const },
  { id: 'm2', conversation_id: 'c1', sender_id: 'u2', content: 'Hey!', read_at: null, created_at: '', status: 'sent' as const },
];

describe('ChatScreen', () => {
  const mockSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRoute as jest.Mock).mockReturnValue({
      params: { recipient: mockRecipient, conversationId: 'c1' },
    });
    (useChat as jest.Mock).mockReturnValue({
      messages: mockMessages,
      loading: false,
      disconnected: false,
      sendMessage: mockSend,
      retryMessage: jest.fn(),
    });
  });

  it('renders messages', () => {
    const { getByText } = render(<ChatScreen />);
    expect(getByText('Hi Bob')).toBeTruthy();
    expect(getByText('Hey!')).toBeTruthy();
  });

  it('shows reconnecting banner when disconnected', () => {
    (useChat as jest.Mock).mockReturnValue({
      messages: [],
      loading: false,
      disconnected: true,
      sendMessage: mockSend,
      retryMessage: jest.fn(),
    });
    const { getByText } = render(<ChatScreen />);
    expect(getByText('Reconnecting...')).toBeTruthy();
  });

  it('calls sendMessage when Send is pressed', () => {
    const { getByPlaceholderText, getByText } = render(<ChatScreen />);
    fireEvent.changeText(getByPlaceholderText('Message...'), 'New message');
    fireEvent.press(getByText('Send'));
    expect(mockSend).toHaveBeenCalledWith('u2', 'New message');
  });

  it('shows failed message with Retry', () => {
    (useChat as jest.Mock).mockReturnValue({
      messages: [{ id: 't1', conversation_id: 'c1', sender_id: 'me', content: 'Fail', read_at: null, created_at: '', status: 'failed', tempId: 't1' }],
      loading: false,
      disconnected: false,
      sendMessage: mockSend,
      retryMessage: jest.fn(),
    });
    const { getByText } = render(<ChatScreen />);
    expect(getByText('Retry')).toBeTruthy();
  });
});
