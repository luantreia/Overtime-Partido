import { io } from 'socket.io-client';

// En producción, esto debería venir de una variable de entorno
const URL = 'https://overtime-ddyl.onrender.com';

export const socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'] // Forzar websocket para mejor rendimiento
});
