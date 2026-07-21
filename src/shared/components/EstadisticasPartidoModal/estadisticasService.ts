// estadisticasService.ts - Servicio para obtener estadísticas de partidos

import { authFetch } from '../../utils/authFetch';
import type {
  ResumenEstadisticasAutomaticas,
  ResumenEstadisticasManual,
  EstadisticaJugadorSetDetalle,
} from './types';

export const getResumenEstadisticasAutomaticas = async (partidoId: string): Promise<ResumenEstadisticasAutomaticas> => {
  // 1) Obtener los sets del partido
  const sets = await authFetch<Array<{ _id: string; numeroSet: number; estadoSet?: string; ganadorSet?: string }>>(`/set-partido?partido=${partidoId}`);

  // 2) Para cada set, obtener las estadísticas de jugador-set directamente
  const setsConEstadisticas = await Promise.all(
    (sets || [])
      .sort((a, b) => (a.numeroSet || 0) - (b.numeroSet || 0))
      .map(async (set) => {
        const stats = await authFetch<EstadisticaJugadorSetDetalle[]>(`/estadisticas/jugador-set?set=${set._id}`);
        // Mapear al tipo resumido esperado por la UI
        const estadisticas = (stats || []).map((s) => ({
          _id: s._id,
          jugadorPartido: s.jugadorPartido,
          throws: s.throws ?? 0,
          hits: s.hits ?? 0,
          outs: s.outs ?? 0,
          catches: s.catches ?? 0,
        }));
        return {
          _id: set._id,
          numeroSet: set.numeroSet,
          estadoSet: set.estadoSet,
          ganadorSet: set.ganadorSet,
          estadisticas,
        };
      })
  );

  return { sets: setsConEstadisticas };
};

export const getResumenEstadisticasManual = async (partidoId: string): Promise<ResumenEstadisticasManual> => {
  return authFetch<ResumenEstadisticasManual>(`/estadisticas/manual?partido=${partidoId}`);
};

export const getEstadisticasJugadorSet = async (setId: string): Promise<EstadisticaJugadorSetDetalle[]> => {
  return authFetch<EstadisticaJugadorSetDetalle[]>(`/estadisticas/jugador-set?set=${setId}`);
};
