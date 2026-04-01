import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client';

const API_BASE = String(import.meta.env.VITE_API_URL || '').trim();
const USE_VITE_PROXY = API_BASE.length === 0;

const DEFAULT_TRANSPORTS: Array<'polling' | 'websocket'> = USE_VITE_PROXY
  ? ['polling']
  : ['websocket', 'polling'];

type AppSocketOptions = Partial<ManagerOptions & SocketOptions>;

export const createAppSocket = (options: AppSocketOptions = {}): Socket => {
  const baseOptions: AppSocketOptions = {
    transports: DEFAULT_TRANSPORTS,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 20,
    withCredentials: true,
  };

  return API_BASE
    ? io(API_BASE, { ...baseOptions, ...options })
    : io(undefined, { ...baseOptions, ...options });
};
