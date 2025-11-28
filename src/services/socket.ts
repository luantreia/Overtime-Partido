import { io } from 'socket.io-client';

// Use localhost in development, production URL otherwise
// Check both hostname and NODE_ENV for development detection
const isDev = window.location.hostname === 'localhost' || 
              window.location.hostname === '127.0.0.1' ||
              process.env.NODE_ENV === 'development';

const URL = isDev 
  ? 'http://localhost:5000'
  : 'https://overtime-ddyl.onrender.com';

console.log('Socket connecting to:', URL, '(isDev:', isDev, ')');

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'] // Forzar websocket para mejor rendimiento
});
