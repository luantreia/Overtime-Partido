import { io } from 'socket.io-client';

// Use localhost in development, production URL otherwise
const URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : 'https://overtime-ddyl.onrender.com';

console.log('Socket connecting to:', URL);

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'] // Forzar websocket para mejor rendimiento
});
