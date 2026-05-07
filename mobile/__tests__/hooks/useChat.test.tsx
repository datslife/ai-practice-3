jest.mock('../../src/api/client', () => ({
  apiClient: { get: jest.fn() },
}));

jest.mock('../../src/socket/socketClient', () => ({
  getSocket: jest.fn(),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChat } from '../../src/hooks/useChat';
import { apiClient } from '../../src/api/client';
import { getSocket } from '../../src/socket/socketClient';
import { Message } from '../../src/types';

const RECIPIENT_ID = 'recipient-uuid';
const CONVERSATION_ID = 'c1';

const existingMessages: Message[] = [
  { id: 'm1', conversation_id: CONVERSATION_ID, sender_id: 'other', content: 'Hi', read_at: null, created_at: '2026-01-01T00:00:00Z' },
];

// Mocks conversation lookup → reject (no prior conversation), so no history fetch interferes.
function mockNoConversation() {
  (apiClient.get as jest.Mock).mockImplementation((url: string) => {
    if (url.startsWith('/conversations/with/')) {
      return Promise.reject({ response: { status: 404 } });
    }
    return Promise.resolve({ data: { messages: [] } });
  });
}

describe('useChat', () => {
  let mockSocket: {
    on: jest.Mock;
    off: jest.Mock;
    emit: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
    (getSocket as jest.Mock).mockReturnValue(mockSocket);
    // Default: conversation found, then messages returned
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url.startsWith('/conversations/with/')) {
        return Promise.resolve({ data: { id: CONVERSATION_ID } });
      }
      return Promise.resolve({ data: { messages: existingMessages } });
    });
  });

  it('loads message history on mount when conversation exists', async () => {
    const { result } = renderHook(() => useChat(RECIPIENT_ID, 'me'));
    await waitFor(() => expect(result.current.messages.length).toBe(1));
    expect(result.current.messages[0].content).toBe('Hi');
  });

  it('starts with empty messages when no prior conversation (404)', async () => {
    mockNoConversation();
    const { result } = renderHook(() => useChat(RECIPIENT_ID, 'me'));
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(result.current.messages.length).toBe(0);
  });

  it('sendMessage adds optimistic message', async () => {
    mockNoConversation();
    const { result } = renderHook(() => useChat(RECIPIENT_ID, 'me'));
    await act(async () => { result.current.sendMessage(RECIPIENT_ID, 'Hello!'); });
    expect(result.current.messages.some((m) => m.content === 'Hello!')).toBe(true);
    expect(result.current.messages.find((m) => m.content === 'Hello!')?.status).toBe('pending');
  });

  it('message:sent replaces optimistic message', async () => {
    mockNoConversation();
    let sentHandler: (data: { tempId: string; id: string; conversationId: string; createdAt: string }) => void;
    mockSocket.on.mockImplementation((event: string, handler: typeof sentHandler) => {
      if (event === 'message:sent') sentHandler = handler;
    });
    const { result } = renderHook(() => useChat(RECIPIENT_ID, 'me'));
    await act(async () => { result.current.sendMessage(RECIPIENT_ID, 'Hello!'); });
    const optimistic = result.current.messages.find((m) => m.content === 'Hello!')!;
    const tempId = optimistic.tempId!;
    act(() => { sentHandler({ tempId, id: 'real-id', conversationId: CONVERSATION_ID, createdAt: new Date().toISOString() }); });
    expect(result.current.messages.find((m) => m.id === 'real-id')?.status).toBe('sent');
  });

  it('message:error marks message as failed', async () => {
    mockNoConversation();
    let errorHandler: (data: { tempId: string; error: string }) => void;
    mockSocket.on.mockImplementation((event: string, handler: typeof errorHandler) => {
      if (event === 'message:error') errorHandler = handler;
    });
    const { result } = renderHook(() => useChat(RECIPIENT_ID, 'me'));
    await act(async () => { result.current.sendMessage(RECIPIENT_ID, 'Hello!'); });
    const tempId = result.current.messages.find((m) => m.content === 'Hello!')!.tempId!;
    act(() => { errorHandler({ tempId, error: 'SEND_FAILED' }); });
    expect(result.current.messages.find((m) => m.tempId === tempId)?.status).toBe('failed');
  });

  it('receives incoming message:new', async () => {
    let newMsgHandler: (data: { id: string; senderId: string; content: string; conversationId: string; createdAt: string }) => void;
    mockSocket.on.mockImplementation((event: string, handler: typeof newMsgHandler) => {
      if (event === 'message:new') newMsgHandler = handler;
    });
    const { result } = renderHook(() => useChat(RECIPIENT_ID, 'me'));
    await waitFor(() => expect(result.current.messages.length).toBe(1));
    act(() => {
      newMsgHandler({ id: 'm2', senderId: 'other', content: 'Hey!', conversationId: CONVERSATION_ID, createdAt: new Date().toISOString() });
    });
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[result.current.messages.length - 1].content).toBe('Hey!');
  });
});
