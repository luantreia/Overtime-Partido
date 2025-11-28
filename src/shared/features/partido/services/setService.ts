import { authFetch } from '../../../utils/authFetch';

export interface SetPartidoDTO {
  _id: string;
  numeroSet: number;
  ganadorSet: 'local' | 'visitante' | 'empate' | 'pendiente';
  estadoSet: 'en_juego' | 'finalizado';
  timerSetValue?: number;
  timerSetRunning?: boolean;
  timerSetLastUpdate?: string;
  timerSuddenDeathValue?: number;
  timerSuddenDeathRunning?: boolean;
  suddenDeathMode?: boolean;
}

export const listSets = (matchId: string) => authFetch<SetPartidoDTO[]>(`/set-partido?partido=${matchId}`);

export const createSet = (matchId: string, numeroSet: number) => authFetch<SetPartidoDTO>(`/set-partido`, {
  method: 'POST',
  body: { partido: matchId, numeroSet, estadoSet: 'en_juego', ganadorSet: 'pendiente' }
});

export const finishSetApi = (setId: string, ganador: 'local' | 'visitante' | 'empate') => authFetch(`/set-partido/${setId}`, {
  method: 'PUT',
  body: { ganadorSet: ganador, estadoSet: 'finalizado' }
});

export const reopenSetApi = (setId: string) => authFetch(`/set-partido/${setId}`, {
  method: 'PUT',
  body: { estadoSet: 'en_juego', ganadorSet: 'pendiente' }
});

export const deleteSetApi = (setId: string) => authFetch(`/set-partido/${setId}`, { method: 'DELETE' });

export const changeWinnerApi = (setId: string, ganador: 'local' | 'visitante' | 'empate') => authFetch(`/set-partido/${setId}`, {
  method: 'PUT',
  body: { ganadorSet: ganador }
});

// Timer persistence for a specific set
export const saveSetTimerState = (setId: string, data: {
  timerSetValue: number;
  timerSetRunning: boolean;
  timerSetLastUpdate: Date;
  timerSuddenDeathValue: number;
  timerSuddenDeathRunning: boolean;
  suddenDeathMode: boolean;
}) => authFetch(`/set-partido/${setId}`, {
  method: 'PUT',
  body: data
});
