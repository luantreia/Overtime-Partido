import { authFetch } from '../../../utils/authFetch';
import type { JugadorPartido } from '../../../../types';
import type { PartidoDetallado } from '../types/partido';

type AlineacionPayload = {
  jugadores: Array<{
    jugadorId: string;
    rol: 'jugador' | 'entrenador';
  }>;
};

export type JugadorSimple = {
  _id?: string;
  nombre?: string;
  apellido?: string;
  alias?: string;
  name?: string;
  fullName?: string;
};

export type EquipoReferencia = string | { _id: string };

export interface JugadorPartidoResumen {
  _id: string;
  jugador: JugadorSimple | string;
  equipo: EquipoReferencia;
}

export type JugadorPartidoCreatePayload = {
  partido: string;
  jugador: string;
  equipo: string;
  creadoPor?: string;
};

export const getAlineacion = (partidoId: string) =>
  authFetch<JugadorPartido[]>(`/jugador-partido?partido=${partidoId}`);

export const guardarAlineacion = (partidoId: string, payload: AlineacionPayload) =>
  authFetch<JugadorPartido[]>(`/jugador-partido/${partidoId}`, {
    method: 'PUT',
    body: payload,
  });

export const crearJugadorPartido = (payload: JugadorPartidoCreatePayload) =>
  authFetch<JugadorPartidoResumen>('/jugador-partido', {
    method: 'POST',
    body: payload,
  });

export const eliminarJugadorPartido = (jugadorPartidoId: string) =>
  authFetch<void>(`/jugador-partido/${jugadorPartidoId}`, { method: 'DELETE' });

export const getPartidoDetallado = (partidoId: string) =>
  authFetch<PartidoDetallado>(`/partidos/${partidoId}`);
