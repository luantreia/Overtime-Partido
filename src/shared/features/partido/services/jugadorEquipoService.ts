import { authFetch } from '../../../utils/authFetch';
import type { Jugador } from '../../../../types';

type JugadorEquipoQuery = {
  equipoId: string;
  estado?: 'activo' | 'pendiente' | 'baja';
};

type BackendJugador = {
  _id: string;
  nombre?: string;
  posicion?: string;
  alias?: string;
  estado?: string;
  numeroCamiseta?: number;
};

type BackendJugadorEquipo = {
  _id: string;
  jugador: BackendJugador | string;
  equipo: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado' | 'baja';
  rol?: string;
  desde?: string;
  hasta?: string;
  fechaSolicitud?: string;
  origen?: 'equipo' | 'jugador';
  fechaAceptacion?: string;
  createdAt?: string;
  updatedAt?: string;
};

const mapJugador = (relacion: BackendJugadorEquipo): Jugador => {
  const jugadorData = typeof relacion.jugador === 'string' ? { _id: relacion.jugador } : relacion.jugador;

  return {
    id: jugadorData._id,
    nombre: jugadorData.nombre ?? jugadorData.alias ?? 'Jugador',
    posicion: jugadorData.posicion ?? 'Jugador',
    numeroCamiseta: jugadorData.numeroCamiseta,
    estado: relacion.estado === 'aceptado' ? 'activo' : relacion.estado === 'baja' ? 'baja' : 'pendiente',
    rolEnEquipo: relacion.rol,
    fechaInicio: relacion.desde ?? undefined,
    fechaFin: relacion.hasta ?? undefined,
    contratoId: relacion._id,
  };
};

export const getJugadoresEquipo = async ({ equipoId, estado }: JugadorEquipoQuery): Promise<Jugador[]> => {
  const queryEstado = estado ? `&estado=${estado}` : '';
  const relaciones = await authFetch<BackendJugadorEquipo[]>(`/jugador-equipo?equipo=${equipoId}${queryEstado}`);
  return relaciones.filter((relacion) => relacion.estado === 'aceptado').map(mapJugador);
};
