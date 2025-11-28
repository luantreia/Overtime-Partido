export interface Partido {
  _id: string;
  nombrePartido?: string;
  fecha?: string;
  hora?: string;
  ubicacion?: string;
  estado?: 'programado' | 'en_curso' | 'finalizado' | 'cancelado';
  equipoLocal?: {
    _id: string;
    nombre: string;
    escudo?: string;
  };
  equipoVisitante?: {
    _id: string;
    nombre: string;
    escudo?: string;
  };
  competencia?: {
    _id: string;
    nombre: string;
  };
  fase?: string;
  etapa?: 'octavos' | 'cuartos' | 'semifinal' | 'final' | 'tercer_puesto' | 'repechaje' | 'otro';
  grupo?: string;
  division?: string;
  modalidad?: 'Foam' | 'Cloth';
  categoria?: 'Masculino' | 'Femenino' | 'Mixto' | 'Libre';
  marcadorLocal?: number;
  marcadorVisitante?: number;
  marcadorModificadoManualmente?: boolean;
  modoEstadisticas?: 'automatico' | 'manual';
  modoVisualizacion?: 'automatico' | 'manual' | 'mixto';
  resultado?: {
    equipoLocal: number;
    equipoVisitante: number;
  };
  creadoPor?: string;
  administradores?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PartidoDetallado extends Partido {
  sets?: SetPartido[];
}

export interface SetPartido {
  _id: string;
  numeroSet: number;
  marcadorLocal?: number;
  marcadorVisitante?: number;
  ganador?: 'local' | 'visitante';
  ganadorSet?: string;
  estadoSet?: string;
  duracion?: number; // minutos
  eventos?: EventoSet[];
}

export interface EventoSet {
  tipo: 'punto' | 'asistencia' | 'bloqueo' | 'falta' | 'custom';
  equipo?: 'local' | 'visitante';
  jugadorId?: string;
  timestamp: string; // ISO
  meta?: Record<string, unknown>;
}
