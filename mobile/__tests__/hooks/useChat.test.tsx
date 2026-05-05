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

const existingMessages: Message[] = [
  { id: 'm1', conversation_id: 'c1', sender_id: 'other', content: 'Hi', read_at: null, created_at: '2026-01-01T00:00:00Z' },
];

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
    (apiClient.get as jest.Mock).mockResolvedValue({ data: existingMessages });
  });

  it('loads message history on mount', async () => {
    const { result } = renderHook(() => useChat('c1', 'me'));
    await waitFor(() => expect(result.current.messages.length).toBe(1));
    expect(result.current.messages[0].content).toBe('Hi');
  });

  it('sendMessage adds optimistic message', async () => {
    const { result } = renderHook(() => useChat(null, 'me'));
    await act(async () => { result.current.sendMessage('recipient-id', 'Hello!'); });
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].status).toBe('pending');
    expect(result.current.messages[0].content).toBe('Hello!');
  });

  it('message:sent replaces optimistic message', async () => {
    let sentHandler: (data: { tempId: string; id: string; conversationId: string; createdAt: string }) => void;
    mockSocket.on.mockImplementation((event: string, handler: typeof sentHandler) => {
      if (event === 'message:sent') sentHandler = handler;
    });
    const { result } = renderHook(() => useChat(null, 'me'));
    await act(async () => { result.current.sendMessage('recipient-id', 'Hello!'); });
    const tempId = result.current.messages[0].tempId!;
    act(() => { sentHandler({ tempId, id: 'real-id', conversationId: 'c1', createdAt: new Date().toISOString() }); });
    expect(result.current.messages[0].id).toBe('real-id');
    expect(result.current.messages[0].status).toBe('sent');
  });

  it('message:error marks message as failed', async () => {
    let errorHandler: (data: { tempId: string; error: string }) => void;
    mockSocket.on.mockImplementation((event: string, handler: typeof errorHandler) => {
      if (event === 'message:error') errorHandler = handler;
    });
    const { result } = renderHook(() => useChat(null, 'me'));
    await act(async () => { result.current.sendMessage('recipient-id', 'Hello!'); });
    const tempId = result.current.messages[0].tempId!;
    act(() => { errorHandler({ tempId, error: 'SEND_FAILED' }); });
    expect(result.current.messages[0].status).toBe('failed');
  });

  it('receives incoming message:new', async () => {
    let newMsgHandler: (data: { id: string; senderId: string; content: string; conversationId: string; createdAt: string }) => void;
    mockSocket.on.mockImplementation((event: string, handler: typeof newMsgHandler) => {
      if (event === 'message:new') newMsgHandler = handler;
    });
    const { result } = renderHook(() => useChat('c1', 'me'));
    await waitFor(() => expect(result.current.messages.length).toBe(1));
    act(() => {
      newMsgHandler({ id: 'm2', senderId: 'other', content: 'Hey!', conversationId: 'c1', createdAt: new Date().toISOString() });
    });
    expect(result.current.messages.length).toBe(2);
    expect(result.current.messages[1].content).toBe('Hey!');
  });
});
