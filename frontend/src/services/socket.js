// src/services/socket.js
import { io } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// ✅ Expose to DevTools
if (typeof window !== "undefined") {
  window.socket = socket;
}
