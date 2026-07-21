// types.ts - Tipos compartidos para estadísticas de partidos

export type ModoEstadisticas = 'automatico' | 'manual';

export interface EstadisticaManualJugador {
  _id?: string;
  jugadorPartido?: {
    _id?: string;
    jugador?: {
      nombre?: string;
      apellido?: string;
    };
    equipo?: {
      _id?: string;
      nombre?: string;
      escudo?: string;
    } | string;
  } | string;
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
  tipoCaptura?: string;
}

export interface EstadisticaManualEquipo {
  _id?: string;
  nombre?: string;
  escudo?: string;
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
  jugadores?: number;
  efectividad?: number;
}

export interface EstadisticaSetResumen {
  _id: string;
  numeroSet: number;
  estadoSet?: string;
  ganadorSet?: string;
  estadisticas?: EstadisticaJugadorSetResumen[];
}

export interface EstadisticaJugadorSetResumen {
  _id: string;
  jugadorPartido?: {
    _id?: string;
    equipo?: {
      _id?: string;
      nombre?: string;
      escudo?: string;
    } | string;
  } | string;
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
}

export interface ResumenEstadisticasAutomaticas {
  sets?: EstadisticaSetResumen[];
}

export interface ResumenEstadisticasManual {
  jugadores?: EstadisticaManualJugador[];
  equipos?: EstadisticaManualEquipo[];
  mensaje?: string;
  tipo?: string;
}

export interface EstadisticaJugadorSetDetalle {
  _id: string;
  jugadorPartido?: {
    _id?: string;
    equipo?: {
      _id?: string;
      nombre?: string;
      escudo?: string;
    } | string;
  } | string;
  equipo?: {
    _id?: string;
    nombre?: string;
    escudo?: string;
  } | string;
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
  tipoCaptura?: string;
}

export interface EstadisticasGeneralesData {
  jugadores?: EstadisticaManualJugador[];
  equipos?: EstadisticaManualEquipo[];
  setsInfo?: EstadisticaSetResumen[];
  mensaje?: string;
  tipo?: string;
}

export interface EstadisticasEquiposData {
  equipos?: EstadisticaManualEquipo[];
  jugadores?: { fuente?: string }[];
}

export interface EstadisticasJugadoresData {
  jugadores?: EstadisticaManualJugador[];
}