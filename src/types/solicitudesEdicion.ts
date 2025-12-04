export type SolicitudEdicionEstado = 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado';
export type SolicitudEdicionTipo = 
  | 'usuario-crear-jugador' 
  | 'usuario-crear-equipo' 
  | 'usuario-crear-competencia'
  | 'usuario-crear-organizacion' 
  | 'usuario-solicitar-admin-jugador' 
  | 'usuario-solicitar-admin-equipo' 
  | 'usuario-solicitar-admin-organizacion'
  | 'jugador-equipo-crear'
  | 'jugador-equipo-eliminar'
  | 'jugador-equipo-editar'
  | 'contratoEquipoCompetencia'
  | 'participacion-temporada-crear'
  | 'participacion-temporada-actualizar'
  | 'participacion-temporada-eliminar'
  | 'jugador-temporada-crear'
  | 'jugador-temporada-actualizar'
  | 'jugador-temporada-eliminar'
  | 'resultadoPartido'
  | 'resultadoSet'
  | 'estadisticasJugadorSet'
  | 'estadisticasJugadorPartido'
  | 'estadisticasEquipoPartido'
  | 'estadisticasEquipoSet';

export interface SolicitudEdicion {
  _id: string;
  tipo: SolicitudEdicionTipo;
  entidad?: string | null;
  datosPropuestos: Record<string, any>;
  estado: SolicitudEdicionEstado;
  creadoPor: string;
  createdAt: string;
  updatedAt: string;
  motivoRechazo?: string;
}

export interface SolicitudOpciones {
    tipo: SolicitudEdicionTipo;
    meta: any;
}

export interface SolicitudContexto {
    contexto: string;
    entidadId?: string;
}

export interface SolicitudFiltros {
    tipo?: string;
    estado?: string;
    creadoPor?: string;
    entidad?: string;
    page?: number;
    limit?: number;
}

export interface SolicitudCrearPayload {
    tipo: SolicitudEdicionTipo;
    entidad?: string;
    datosPropuestos: Record<string, any>;
}

export interface SolicitudActualizarPayload {
    estado: SolicitudEdicionEstado;
    motivoRechazo?: string;
}

export interface SolicitudesPaginadas {
    solicitudes: SolicitudEdicion[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface SolicitudAprobadores {
    aprobadores: {
        administradores: string[];
        organizacion: string[];
        global: string[];
    };
    puedeAprobar: boolean;
}

export class SolicitudValidationError extends Error {
    constructor(message: string, public details: any) {
        super(message);
        this.name = 'SolicitudValidationError';
    }
}

export class SolicitudPermissionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SolicitudPermissionError';
    }
}

export class SolicitudBusinessError extends Error {
    constructor(message: string, public details: any) {
        super(message);
        this.name = 'SolicitudBusinessError';
    }
}