import type { Socket } from 'socket.io-client';

export type OverlayType = 'GOAL' | 'LOWER_THIRD' | 'AD' | 'TIMEOUT' | 'REVIEW' | 'SET_WINNER' | 'ALL';

interface OverlayPayloadBase { [key: string]: any }
export interface TimeoutPayload { title: string; subtitle: string }
export interface ReviewPayload { title: string; subtitle: string }
export interface SetWinnerPayload { title: string; subtitle: string }

export type OverlayPayload = OverlayPayloadBase | TimeoutPayload | ReviewPayload | SetWinnerPayload | undefined;

export const showOverlay = (socket: Socket, matchId: string | null, type: OverlayType, payload?: OverlayPayload) => {
  if (!matchId) return;
  socket.emit('overlay:trigger', { matchId, type, action: 'SHOW', payload });
};

export const hideOverlay = (socket: Socket, matchId: string | null, type: OverlayType = 'ALL') => {
  if (!matchId) return;
  socket.emit('overlay:trigger', { matchId, type, action: 'HIDE' });
};

export const overlayAutoHide = (socket: Socket, matchId: string | null, type: OverlayType, payload: OverlayPayload, ms: number = 2000) => {
  showOverlay(socket, matchId, type, payload);
  setTimeout(() => hideOverlay(socket, matchId, type), ms);
};
