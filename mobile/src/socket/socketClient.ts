import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export function connect(token: string): Socket {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  heartbeatInterval = setInterval(() => {
    socket?.emit('heartbeat');
  }, 15000);
  return socket;
}

export function disconnect(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}

export function emitHeartbeat(): void {
  socket?.emit('heartbeat');
}
