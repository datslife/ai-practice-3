jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
  return { io: jest.fn(() => mockSocket) };
});

import { io as mockIo } from 'socket.io-client';
import { connect, disconnect, getSocket, emitHeartbeat } from '../../src/socket/socketClient';

describe('socketClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    disconnect();
  });

  it('connect creates socket with token auth', () => {
    connect('my-token');
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ auth: { token: 'my-token' } })
    );
  });

  it('getSocket returns null before connect', () => {
    expect(getSocket()).toBeNull();
  });

  it('getSocket returns socket after connect', () => {
    connect('my-token');
    expect(getSocket()).not.toBeNull();
  });

  it('disconnect clears socket', () => {
    connect('my-token');
    disconnect();
    expect(getSocket()).toBeNull();
  });

  it('emitHeartbeat emits heartbeat event', () => {
    connect('my-token');
    emitHeartbeat();
    const socket = getSocket();
    expect(socket?.emit).toHaveBeenCalledWith('heartbeat');
  });
});
