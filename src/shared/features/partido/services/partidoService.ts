import { authFetch } from '../../../../shared/utils/authFetch'; // Adjust path as needed
import { Partido, PartidoDetallado, SetPartido } from '../types/partido';

export const getPartidos = async (params?: Record<string, string | undefined>): Promise<Partido[]> => {
  const qs = params ? new URLSearchParams(params as any).toString() : '';
  return authFetch(`/api/partidos?${qs}`);
};

export const getPartido = async (id: string): Promise<Partido> => {
  return authFetch(`/api/partidos/${id}`);
};

export const getPartidoDetallado = async (id: string): Promise<PartidoDetallado> => {
  return authFetch(`/api/partidos/${id}/detallado`);
};

export const crearPartido = async (data: Partial<Partido>): Promise<Partido> => {
  return authFetch('/api/partidos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const actualizarPartido = async (id: string, data: Partial<Partido>): Promise<Partido> => {
  return authFetch(`/api/partidos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const eliminarPartido = async (id: string): Promise<void> => {
  return authFetch(`/api/partidos/${id}`, {
    method: 'DELETE',
  });
};

// Sets management
export const obtenerSetsDePartido = async (partidoId: string): Promise<SetPartido[]> => {
  return authFetch(`/api/partidos/${partidoId}/sets`);
};

export const crearSetPartido = async (partidoId: string, data: Partial<SetPartido>): Promise<SetPartido> => {
  return authFetch(`/api/partidos/${partidoId}/sets`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const actualizarSetPartido = async (partidoId: string, setId: string, data: Partial<SetPartido>): Promise<SetPartido> => {
  return authFetch(`/api/partidos/${partidoId}/sets/${setId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const eliminarSetPartido = async (partidoId: string, setId: string): Promise<void> => {
  return authFetch(`/api/partidos/${partidoId}/sets/${setId}`, {
    method: 'DELETE',
  });
};

export const actualizarModoVisualizacionPartido = async (partidoId: string, modo: 'automatico' | 'manual' | 'mixto'): Promise<void> => {
  return authFetch(`/api/partidos/${partidoId}/modo-visualizacion`, {
    method: 'PATCH',
    body: JSON.stringify({ modo }),
  });
};

export const actualizarModoEstadisticasPartido = async (partidoId: string, modo: 'automatico' | 'manual'): Promise<void> => {
  return authFetch(`/api/partidos/${partidoId}/modo-estadisticas`, {
    method: 'PATCH',
    body: JSON.stringify({ modo }),
  });
};

export const recalcularMarcadorPartido = async (partidoId: string): Promise<void> => {
  return authFetch(`/api/partidos/${partidoId}/recalcular-marcador`, {
    method: 'POST',
  });
};
