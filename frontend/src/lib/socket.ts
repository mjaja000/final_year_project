import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client';

const API_BASE = String(import.meta.env.VITE_API_URL || '').trim();

type AppSocketOptions = Partial<ManagerOptions & SocketOptions>;

export const createAppSocket = (options: AppSocketOptions = {}): Socket => {
  const baseOptions: AppSocketOptions = {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 20,
    withCredentials: true,
  };

  return API_BASE
    ? io(API_BASE, { ...baseOptions, ...options })
    : io(undefined, { ...baseOptions, ...options });
};

export default createAppSocket;
