import { io } from 'socket.io-client';

// Derive the socket host from the same REACT_APP_API_URL used for HTTP calls,
// so switching between local backend and Render only requires editing .env.
const API_BASE_URL = process.env.REACT_APP_API_URL ?? 'https://overtime-ddyl.onrender.com/api';
const URL = API_BASE_URL.replace(/\/api\/?$/, '');

console.log('Socket connecting to:', URL);

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'] // Forzar websocket para mejor rendimiento
});
