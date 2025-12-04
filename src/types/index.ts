export * from './solicitudesEdicion';

export type RolUsuario = 'admin' | 'manager' | 'staff' | 'lector';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export interface Notificacion {
    id: string;
    mensaje: string;
    leido: boolean;
    fecha: string;
    tipo: 'info' | 'alerta' | 'error';
}

export interface EquipoCompetencia {
    id: string;
    nombre: string;
    estado: 'pendiente' | 'aceptado' | 'rechazado';
    fixtureUrl?: string;
    competencia?: {
        nombre: string;
        faseActual?: string;
        posicionActual?: number;
    };
}

export interface Equipo {
    id: string;
    nombre: string;
    descripcion?: string;
    staff: string[];
}

export interface Jugador {
    id: string;
    nombre: string;
    estado: 'activo' | 'pendiente' | 'baja';
    rolEnEquipo?: string;
    posicion?: string;
    numeroCamiseta?: number;
    fechaInicio?: string;
    fechaFin?: string;
    contratoId?: string;
}

export interface SolicitudJugador {
    id: string;
    nombre: string;
    jugador?: {
        nombre: string;
        posicion?: string;
    };
    estado?: string;
    mensaje?: string;
    origen?: 'equipo' | 'jugador';
}

export interface SetPartido {
    _id: string;
    numeroSet: number;
    estadoSet: string;
    ganadorSet: string;
    marcadorLocal?: number;
    marcadorVisitante?: number;
}

export interface Partido {
    id: string;
    _id?: string;
    nombre?: string;
    equipoLocal?: {
        id: string;
        nombre: string;
        escudo?: string;
    };
    equipoVisitante?: {
        id: string;
        nombre: string;
        escudo?: string;
    };
    fecha?: string;
    hora?: string;
    estado?: 'programado' | 'en_juego' | 'finalizado' | 'cancelado' | 'proximamente' | 'en_curso';
    resultado?: {
        puntosEquipo: number;
        puntosRival: number;
    } | string;
    marcadorLocal?: number;
    marcadorVisitante?: number;
    competencia?: {
        nombre: string;
    };
    competenciaId?: string;
    faseId?: string;
    rival?: string;
    escenario?: string;
    imagen?: string;
    modoEstadisticas?: any;
    modoVisualizacion?: any;
    sets?: SetPartido[];
    [key: string]: any;
}