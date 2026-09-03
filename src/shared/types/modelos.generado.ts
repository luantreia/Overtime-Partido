/* eslint-disable */
/**
 * ARCHIVO GENERADO — NO EDITAR A MANO.
 *
 * Lo produce `scripts/generarTipos.js` en el repo del backend a partir de los schemas de
 * Mongoose, y se copia a los 6 frontends. Cualquier cambio hecho acá se pierde en la próxima
 * corrida; si un tipo está mal, el que está mal es el schema.
 *
 * Para regenerarlo, desde el repo `overtime`:
 *     node scripts/generarTipos.js
 *
 * Las fechas son `string`: viajan como ISO en JSON. Los campos son opcionales salvo que el
 * schema los marque `required` o les dé un `default`, porque en esos casos siempre vienen.
 */

/**
 * Una referencia a otro documento. Según el endpoint viene como el id suelto o como el
 * documento entero populado, así que el consumidor tiene que angostarla antes de usarla:
 *
 *     const id = typeof partido.equipoLocal === 'string' ? partido.equipoLocal : partido.equipoLocal?._id;
 */
export type Ref<T> = string | T;

/* ---------- Uniones de los enums de los schemas ---------- */

export type ActividadAbiertoA = 'cualquiera' | 'inscriptos' | 'solo_competencia';
export type ActividadRecurrenteAbiertoA = 'cualquiera' | 'inscriptos' | 'solo_competencia';
export type ActividadRecurrenteDiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
export type ActividadRecurrenteTipo = 'lod' | 'recreativo' | 'jornada' | 'evento' | 'taller';
export type ActividadTipo = 'lod' | 'recreativo' | 'jornada' | 'evento' | 'taller';
export type AsignacionPartidoEstado = 'activa' | 'revocada';
export type AsignacionPartidoPermisos = 'match.lineup' | 'match.sets' | 'match.resultado' | 'match.stats' | 'match.view_private' | 'match.*';
export type AsignacionPartidoRol = 'planillero' | 'arbitro' | 'mesa' | 'veedor';
export type AsistenciaEntrenamientoEstado = 'convocado' | 'presente' | 'tarde' | 'ausente' | 'justificado';
export type AuditoriaAccion = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE';
export type CompetenciaCategoria = 'Masculino' | 'Femenino' | 'Mixto' | 'Libre';
export type CompetenciaEstado = 'programada' | 'en_curso' | 'finalizada' | 'cancelada' | 'en_creacion';
export type CompetenciaModalidad = 'Foam' | 'Cloth';
export type CompetenciaTipo = 'liga' | 'torneo' | 'otro';
export type EntrenamientoEstado = 'programado' | 'realizado' | 'cancelado';
export type EntrenamientoTipo = 'general' | 'fisico' | 'tactico' | 'tecnico' | 'amistoso_interno' | 'otro';
export type EquipoCompetenciaEstado = 'suspendido' | 'aceptado' | 'baja';
export type EquipoPartidoResultado = 'ganado' | 'perdido' | 'empate' | 'pendiente';
export type EquipoTipo = 'club' | 'seleccion' | 'academia' | 'otro';
export type EstadisticasEquipoPartidoEstadoPublicacion = 'privada' | 'pendiente_aprobacion' | 'organizacion' | 'publica' | 'rechazada';
export type EstadisticasEquipoPartidoVisibilidadObjetivo = 'organizacion' | 'publica';
export type EstadisticasJugadorPartidoEstadoPublicacion = 'privada' | 'pendiente_aprobacion' | 'organizacion' | 'publica' | 'rechazada';
export type EstadisticasJugadorPartidoManualEstadoPublicacion = 'privada' | 'pendiente_aprobacion' | 'organizacion' | 'publica' | 'rechazada';
export type EstadisticasJugadorPartidoManualVisibilidadObjetivo = 'organizacion' | 'publica';
export type EstadisticasJugadorPartidoVisibilidadObjetivo = 'organizacion' | 'publica';
export type EstadisticasJugadorSetEstadoPublicacion = 'privada' | 'pendiente_aprobacion' | 'organizacion' | 'publica' | 'rechazada';
export type EstadisticasJugadorSetVisibilidadObjetivo = 'organizacion' | 'publica';
export type FaseCriterio = 'global' | 'por_grupo';
export type FaseCriteriosDesempate = 'PUNTOS' | 'DIF_SETS' | 'SETS_FAVOR' | 'PUNTOS_FAVOR' | 'DIF_PUNTOS' | 'CARA_A_CARA' | 'MENOS_TARJETAS';
export type FaseEstado = 'programada' | 'en_curso' | 'finalizada';
export type FaseEstrategiaSembrado = 'posicion_directa' | 'manual' | 'aleatorio';
export type FaseFormato = 'simple' | 'doble_eliminacion';
export type FaseTipo = 'grupo' | 'liga' | 'playoff' | 'promocion' | 'otro';
export type FeedbackTipo = 'sugerencia' | 'bug' | 'pregunta' | 'otro';
export type JugadorCompetenciaEstado = 'aceptado' | 'suspendido';
export type JugadorEquipoEstado = 'aceptado' | 'baja';
export type JugadorEquipoOrigen = 'equipo' | 'jugador';
export type JugadorEquipoRol = 'jugador' | 'entrenador';
export type JugadorFaseEstado = 'aceptado' | 'baja' | 'suspendido';
export type JugadorFaseRol = 'jugador' | 'entrenador';
export type JugadorGenero = 'masculino' | 'femenino' | 'otro';
export type JugadorPartidoEstado = 'aceptado' | 'baja' | 'suspendido';
export type JugadorPartidoRol = 'jugador' | 'entrenador';
export type JugadorTemporadaEstado = 'aceptado' | 'baja' | 'suspendido';
export type JugadorTemporadaRol = 'jugador' | 'entrenador';
export type KarmaLogType = 'positive' | 'negative' | 'no-show' | 'fair-play' | 'mvp';
export type LobbyBallType = 'Foam' | 'Cloth';
export type LobbyCategoria = 'Masculino' | 'Femenino' | 'Mixto' | 'Libre';
export type LobbyGenderPolicy = 'open' | 'male' | 'female' | 'mixed';
export type LobbyModalidad = 'Foam' | 'Cloth';
export type LobbyStatus = 'open' | 'full' | 'playing' | 'finished' | 'cancelled';
export type MatchPlayerOutcome = 'win' | 'loss' | 'draw';
export type MatchPlayerTeamColor = 'rojo' | 'azul';
export type MatchTeamColor = 'rojo' | 'azul';
export type MiembroEquipoEstado = 'invitado' | 'activo' | 'suspendido' | 'inactivo';
export type MiembroEquipoPermisos = 'stats.capture' | 'stats.edit' | 'stats.view_private' | 'matches.manage' | 'lineup.manage' | 'trainings.manage' | 'members.manage' | 'team.settings.manage' | 'team.*';
export type MiembroEquipoRol = 'jugador' | 'entrenador' | 'video_analista' | 'preparador_fisico' | 'community_manager' | 'sponsor_manager' | 'staff' | 'otro';
export type MiembroOrganizacionEstado = 'activo' | 'suspendido' | 'inactivo';
export type MiembroOrganizacionRol = 'presidente' | 'secretario' | 'tesorero' | 'delegado' | 'arbitro' | 'coordinador' | 'staff';
export type Origen = 'inscripcion_web' | 'ranked' | 'partido' | 'manual';
export type ParticipacionTemporadaEstado = 'activo' | 'baja' | 'expulsado';
export type PartidoCategoria = 'Masculino' | 'Femenino' | 'Mixto' | 'Libre';
export type PartidoEstado = 'programado' | 'en_juego' | 'finalizado' | 'cancelado';
export type PartidoEtapa = 'treintaidosavos' | 'dieciseisavos' | 'octavos' | 'cuartos' | 'semifinal' | 'final' | 'tercer_puesto' | 'repechaje' | 'otro';
export type PartidoLocal = 'rojo' | 'azul';
export type PartidoModalidad = 'Foam' | 'Cloth';
export type PartidoModoEstadisticas = 'automatico' | 'manual';
export type PartidoModoVisualizacion = 'automatico' | 'manual' | 'mixto';
export type PartidoVisitante = 'rojo' | 'azul';
export type PlanillaEquipoEstado = 'borrador' | 'pendiente_oficializacion' | 'oficializada' | 'rechazada';
export type PlanillaEquipoFuentePreferida = 'oficial' | 'planilla';
export type PlanillaEquipoModo = 'sets' | 'directa';
export type PlanillaEquipoVisibilidadObjetivo = 'organizacion' | 'publica';
export type PlanillaPresenteRol = 'jugador' | 'entrenador';
export type PlanillaSetGanadorSet = 'local' | 'visitante' | 'empate' | 'pendiente';
export type SetPartidoEstadoSet = 'en_juego' | 'finalizado';
export type SetPartidoGanadorSet = 'local' | 'visitante' | 'empate' | 'pendiente';
export type SolicitudEdicionEstado = 'pendiente' | 'aceptado' | 'rechazado' | 'cancelado';
export type SolicitudEdicionTipo = 'jugador-equipo-editar' | 'jugador-equipo-crear' | 'jugador-equipo-eliminar' | 'contratoEquipoCompetencia' | 'participacion-temporada-crear' | 'participacion-temporada-actualizar' | 'participacion-temporada-eliminar' | 'jugador-temporada-crear' | 'jugador-temporada-actualizar' | 'jugador-temporada-eliminar' | 'resultadoPartido' | 'editarPartidoCompetencia' | 'resultadoSet' | 'estadisticasJugadorSet' | 'estadisticasJugadorPartido' | 'estadisticasEquipoPartido' | 'estadisticasEquipoSet' | 'estadisticas-set-propuesta' | 'estadisticas-partido-propuesta' | 'estadisticasJugadorSet-lote' | 'planilla-equipo-oficializacion' | 'usuario-crear-jugador' | 'usuario-crear-equipo' | 'usuario-crear-organizacion' | 'usuario-solicitar-admin-jugador' | 'usuario-solicitar-admin-equipo' | 'usuario-solicitar-admin-organizacion' | 'jugador-claim';
export type TargetRole = 'host' | 'rivalCaptain' | 'official';
export type Team = 'A' | 'B' | 'none';
export type TeamColor = 'rojo' | 'azul';
export type TemporadaEstado = 'en_creacion' | 'en_curso' | 'finalizada';
export type TipoTestMejorEs = 'mayor' | 'menor' | 'neutro';
export type TokenUsuarioTipo = 'reset-password' | 'verificacion-email';
export type Type = 'principal' | 'secundario' | 'linea';
export type UsuarioProvider = 'firebase' | 'local';
export type UsuarioRol = 'lector' | 'editor' | 'admin';
export type Winner = 'A' | 'B' | 'empate';

/* ---------- Documentos ---------- */

export interface Actividad {
  nombre: string;
  tipo: ActividadTipo;
  sede: Ref<Sede> | null;
  ubicacion: string;
  organizacion: Ref<Organizacion> | null;
  origenRecurrente: Ref<ActividadRecurrente> | null;
  fechaInicio: string;
  fechaFin: string;
  abiertoA: ActividadAbiertoA;
  permiteEspectadores: boolean;
  descripcion: string;
  visibilidadPublica: boolean;
  jugadores?: Array<{
    jugador: Ref<Jugador>;
    inscripto: boolean;
    presente: boolean;
    origen: Origen;
    inscritoEn: string | null;
    presenteEn: string | null;
    _id: string;
    }>;
  creadoPor: string;
  administradores?: Array<string>;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActividadRecurrente {
  nombre: string;
  tipo: ActividadRecurrenteTipo;
  sede: Ref<Sede> | null;
  ubicacion: string;
  organizacion: Ref<Organizacion> | null;
  diaSemana: ActividadRecurrenteDiaSemana;
  horaInicio: string;
  horaFin: string;
  abiertoA: ActividadRecurrenteAbiertoA;
  permiteEspectadores: boolean;
  descripcion: string;
  visibilidadPublica: boolean;
  activa: boolean;
  creadoPor: string;
  administradores?: Array<string>;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AsignacionPartido {
  usuarioId: string;
  partido?: Ref<Partido>;
  fase?: Ref<Fase>;
  rol: AsignacionPartidoRol;
  permisos?: Array<AsignacionPartidoPermisos>;
  estado: AsignacionPartidoEstado;
  desde: string;
  hasta?: string;
  notas: string;
  creadoPor: string;
  actualizadoPor?: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AsistenciaEntrenamiento {
  entrenamiento: Ref<Entrenamiento>;
  jugador: Ref<Jugador>;
  estado: AsistenciaEntrenamientoEstado;
  minutosTarde: number;
  notas: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Auditoria {
  usuario: Ref<Usuario>;
  entidad: string;
  entidadId: string;
  accion: AuditoriaAccion;
  cambios?: {
    before?: unknown;
    after?: unknown;
  };
  ip?: string;
  userAgent?: string;
  timestamp: string;
  _id: string;
}

export interface Competencia {
  nombre?: string;
  descripcion?: string;
  organizacion: Ref<Organizacion>;
  modalidad: CompetenciaModalidad;
  categoria: CompetenciaCategoria;
  tipo: CompetenciaTipo;
  foto?: string;
  fechaInicio: string;
  fechaFin?: string;
  estado: CompetenciaEstado;
  creadoPor: string;
  administradores?: Array<string>;
  rankedEnabled: boolean;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Entrenamiento {
  equipo: Ref<Equipo>;
  fecha: string;
  duracionMinutos: number;
  lugar: string;
  sede: Ref<Sede> | null;
  tipo: EntrenamientoTipo;
  estado: EntrenamientoEstado;
  titulo: string;
  notas: string;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Equipo {
  nombre: string;
  escudo?: string;
  foto?: string;
  colores: Array<string>;
  fechaFormacion?: string;
  fechaDisolucion?: string;
  tipo: EquipoTipo;
  esSeleccionNacional: boolean;
  pais: string;
  federacion?: string;
  descripcion: string;
  sitioWeb: string;
  redesSociales?: {
    instagram: string;
    facebook: string;
    twitter: string;
    tiktok: string;
    youtube: string;
  };
  verificado: boolean;
  verificadoPor: string | null;
  verificadoEn: string | null;
  creadoPor: string;
  administradores?: Array<string>;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquipoCompetencia {
  nombre?: string;
  equipo: Ref<Equipo>;
  competencia: Ref<Competencia>;
  estado: EquipoCompetenciaEstado;
  solicitadoPor?: string;
  creadoPor: string;
  administradores?: Array<string>;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquipoPartido {
  partido: Ref<Partido>;
  equipo: Ref<Equipo>;
  equipoCompetencia?: Ref<EquipoCompetencia>;
  participacionTemporada?: Ref<ParticipacionTemporada>;
  participacionFase?: Ref<ParticipacionFase>;
  esLocal: boolean;
  sePresento: boolean;
  descalificado: boolean;
  puntosObtenidos: number;
  resultado: EquipoPartidoResultado;
  observaciones?: string;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EstadisticasEquipoPartido {
  partido: Ref<Partido>;
  equipo: Ref<Equipo>;
  equipoPartido?: Ref<EquipoPartido>;
  throws: number | null;
  hits: number | null;
  outs: number | null;
  catches: number | null;
  calculado: boolean;
  estadoPublicacion: EstadisticasEquipoPartidoEstadoPublicacion;
  solicitudPublicacion?: Ref<SolicitudEdicion>;
  visibilidadObjetivo: EstadisticasEquipoPartidoVisibilidadObjetivo;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EstadisticasJugadorPartido {
  jugadorPartido: Ref<JugadorPartido>;
  throws: number;
  hits: number;
  outs: number;
  catches: number;
  fuente: string;
  ultimaActualizacion: string;
  setsCalculados: number;
  estadoPublicacion: EstadisticasJugadorPartidoEstadoPublicacion;
  solicitudPublicacion?: Ref<SolicitudEdicion>;
  visibilidadObjetivo: EstadisticasJugadorPartidoVisibilidadObjetivo;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EstadisticasJugadorPartidoManual {
  jugadorPartido: Ref<JugadorPartido>;
  throws: number;
  hits: number;
  outs: number;
  catches: number;
  fuente: string;
  ultimaActualizacion: string;
  notas?: string;
  version: number;
  estadoPublicacion: EstadisticasJugadorPartidoManualEstadoPublicacion;
  solicitudPublicacion?: Ref<SolicitudEdicion>;
  visibilidadObjetivo: EstadisticasJugadorPartidoManualVisibilidadObjetivo;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EstadisticasJugadorSet {
  set: Ref<SetPartido>;
  jugadorPartido: Ref<JugadorPartido>;
  jugador: Ref<Jugador>;
  equipo: Ref<Equipo>;
  throws: number;
  hits: number;
  outs: number;
  catches: number;
  survive: boolean;
  estadoPublicacion: EstadisticasJugadorSetEstadoPublicacion;
  solicitudPublicacion?: Ref<SolicitudEdicion>;
  visibilidadObjetivo: EstadisticasJugadorSetVisibilidadObjetivo;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Fase {
  temporada: Ref<Temporada>;
  nombre: string;
  tipo: FaseTipo;
  estado: FaseEstado;
  orden: number;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  configuracion?: {
    puntuacion?: {
      victoria: number;
      empate: number;
      derrota: number;
      setGanado: number;
      perderPorW: number;
      arbitroPresentado: number;
      penalizacionNoArbitro: number;
    };
    criteriosDesempate?: Array<FaseCriteriosDesempate>;
    progresion?: {
      clasificanDirecto: number;
      mejoresAdicionales?: {
        cantidad: number;
        posicion?: number;
        criterio?: FaseCriterio;
      };
      destinoGanadores?: Ref<Fase>;
      destinoPerdedores?: Ref<Fase>;
      estrategiaSembrado: FaseEstrategiaSembrado;
    };
    playoff?: {
      formato: FaseFormato;
      idaYVuelta: boolean;
      tercerPuesto: boolean;
      rondasConConsolacion?: Array<string>;
    };
  };
  numeroClasificados?: number;
  faseOrigenA?: Ref<Fase>;
  faseOrigenB?: Ref<Fase>;
  creadoPor: string;
  administradores?: Array<string>;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Feedback {
  message: string;
  tipo: FeedbackTipo;
  page?: string;
  userUid?: string;
  userName?: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvitacionJugador {
  jugador: Ref<Jugador>;
  tokenHash: string;
  creadoPor: string;
  expiresAt: string;
  usedAt: string | null;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Jugador {
  nombre: string;
  alias?: string;
  fechaNacimiento?: string;
  genero: JugadorGenero;
  foto?: string;
  nacionalidad: string;
  userId: string | null;
  perfilReclamado: boolean;
  creadoPor: string;
  administradores?: Array<string>;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JugadorCompetencia {
  jugador: Ref<Jugador>;
  competencia: Ref<Competencia>;
  estado: JugadorCompetenciaEstado;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JugadorEquipo {
  jugador: Ref<Jugador>;
  equipo: Ref<Equipo>;
  desde?: string;
  hasta?: string;
  estado: JugadorEquipoEstado;
  rol: JugadorEquipoRol;
  solicitadoPor?: string;
  origen: JugadorEquipoOrigen;
  fechaSolicitud: string;
  fechaAceptacion?: string;
  motivoRechazo?: string;
  foto?: string;
  creadoPor: string;
  administradores?: Array<string>;
  nombreJugadorEquipo?: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JugadorFase {
  jugadorTemporada: Ref<JugadorTemporada>;
  participacionFase: Ref<ParticipacionFase>;
  jugador: Ref<Jugador>;
  estado: JugadorFaseEstado;
  rol: JugadorFaseRol;
  creadoPor: Ref<Usuario>;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JugadorPartido {
  partido: Ref<Partido>;
  jugador: Ref<Jugador>;
  jugadorEquipo?: Ref<JugadorEquipo>;
  jugadorCompetencia?: Ref<JugadorCompetencia>;
  jugadorTemporada?: Ref<JugadorTemporada>;
  equipo: Ref<Equipo>;
  equipoPartido?: Ref<EquipoPartido>;
  estado: JugadorPartidoEstado;
  rol: JugadorPartidoRol;
  numero?: number;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JugadorTemporada {
  jugadorEquipo: Ref<JugadorEquipo>;
  jugador: Ref<Jugador>;
  participacionTemporada: Ref<ParticipacionTemporada>;
  desde: string;
  hasta?: string;
  estado: JugadorTemporadaEstado;
  rol: JugadorTemporadaRol;
  numeroCamiseta?: number;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KarmaLog {
  targetPlayer: Ref<Jugador>;
  fromUser: string;
  lobbyId: Ref<Lobby>;
  type: KarmaLogType;
  points: number;
  comment?: string;
  createdAt: string;
  _id: string;
  updatedAt: string;
}

export interface Lobby {
  host: string;
  title: string;
  description?: string;
  modalidad: LobbyModalidad;
  categoria: LobbyCategoria;
  location?: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    address?: string;
  };
  scheduledDate: string;
  maxPlayers: number;
  requireOfficial: boolean;
  genderPolicy: LobbyGenderPolicy;
  status: LobbyStatus;
  players?: Array<{
    player?: Ref<Jugador>;
    userUid?: string;
    team: Team;
    joinedAt: string;
    confirmed: boolean;
    isAFK: boolean;
    _id: string;
    }>;
  officials?: Array<{
    player?: Ref<Jugador>;
    userUid?: string;
    type: Type;
    confirmed: boolean;
    _id: string;
    }>;
  matchData?: {
    sets?: Array<{
    winner?: Winner;
    scoreA?: number;
    scoreB?: number;
    timestamp: string;
    _id: string;
    }>;
    duration?: number;
    ballType?: LobbyBallType;
  };
  result?: {
    scoreA: number;
    scoreB: number;
    submittedBy?: string;
    confirmedByHost: boolean;
    confirmedByOpponent: boolean;
    validatedByOfficial: boolean;
    disputed: boolean;
  };
  rivalCaptainUid?: string;
  cancelRequest?: {
    hostRequested: boolean;
    rivalConfirmed: boolean;
  };
  votedUsers?: Array<string>;
  authorityInactivityReports?: Array<{
    fromUser?: string;
    targetRole?: TargetRole;
    timestamp: string;
    _id: string;
    }>;
  matchId?: Ref<Partido>;
  actividad: Ref<Actividad> | null;
  appliedMultiplier?: number;
  avgKarma?: number;
  createdAt: string;
  updatedAt: string;
  _id: string;
}

export interface MatchPlayer {
  partidoId: Ref<Partido>;
  playerId: Ref<Jugador>;
  teamColor?: MatchPlayerTeamColor;
  preRating?: number;
  postRating?: number;
  delta?: number;
  win?: boolean;
  outcome?: MatchPlayerOutcome;
  isAFK: boolean;
  competenciaId?: Ref<Competencia>;
  temporadaId?: Ref<Temporada>;
  modalidad?: string;
  categoria?: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchTeam {
  partidoId: Ref<Partido>;
  color: MatchTeamColor;
  players?: Array<Ref<Jugador>>;
  averagePreRating?: number;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MiembroEquipo {
  equipo: Ref<Equipo>;
  usuarioId: string;
  rol: MiembroEquipoRol;
  permisos?: Array<MiembroEquipoPermisos>;
  estado: MiembroEquipoEstado;
  notas: string;
  creadoPor: string;
  actualizadoPor?: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MiembroOrganizacion {
  organizacion: Ref<Organizacion>;
  usuarioId: string;
  rol: MiembroOrganizacionRol;
  permisos?: Array<string>;
  estado: MiembroOrganizacionEstado;
  notas?: string;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Organizacion {
  nombre: string;
  descripcion?: string;
  logo?: string;
  sitioWeb?: string;
  videoFondoUrl: string;
  redesSociales?: {
    instagram: string;
    facebook: string;
    twitter: string;
    tiktok: string;
    youtube: string;
  };
  creadoPor: string;
  administradores?: Array<string>;
  verificada: boolean;
  activa: boolean;
  miembrosPublicos: boolean;
  requiereInvitacion: boolean;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParticipacionFase {
  participacionTemporada: Ref<ParticipacionTemporada>;
  fase: Ref<Fase>;
  grupo: string | null;
  division: string | null;
  puntos: number;
  partidosJugados: number;
  partidosGanados: number;
  partidosPerdidos: number;
  partidosEmpatados: number;
  diferenciaPuntos: number;
  clasificado: boolean;
  eliminado: boolean;
  seed: number | null;
  posicion: number | null;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParticipacionTemporada {
  equipo: Ref<Equipo>;
  temporada: Ref<Temporada>;
  estado: ParticipacionTemporadaEstado;
  observaciones: string;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Partido {
  competencia?: Ref<Competencia>;
  temporada?: Ref<Temporada>;
  fase?: Ref<Fase>;
  etapa: PartidoEtapa | null;
  grupo: string | null;
  division: string | null;
  jornada: string | null;
  posicionBracket: number;
  nombrePartido?: string;
  modalidad: PartidoModalidad;
  categoria: PartidoCategoria;
  fecha: string;
  ubicacion?: string;
  cancha: string | null;
  sede: Ref<Sede> | null;
  actividad: Ref<Actividad> | null;
  equipoLocal?: Ref<Equipo>;
  equipoVisitante?: Ref<Equipo>;
  participacionFaseLocal?: Ref<ParticipacionFase>;
  participacionFaseVisitante?: Ref<ParticipacionFase>;
  marcadorLocal: number;
  marcadorVisitante: number;
  marcadorModificadoManualmente: boolean;
  timerMatchValue: number;
  timerMatchRunning: boolean;
  timerMatchLastUpdate: string;
  period: number;
  modoEstadisticas: PartidoModoEstadisticas;
  modoVisualizacion: PartidoModoVisualizacion;
  creadoPor: string;
  administradores?: Array<string>;
  estado: PartidoEstado;
  isRanked: boolean;
  rankedMeta?: {
    applied: boolean;
    modalidad?: string;
    categoria?: string;
    teamColors?: {
      local?: PartidoLocal;
      visitante?: PartidoVisitante;
    };
    temporadaId?: Ref<Temporada>;
    afkPlayers?: Array<Ref<Jugador>>;
    startTime?: string;
    endTime?: string;
    matchDuration: number;
    setDuration: number;
    suddenDeathLimit: number;
    snapshot?: {
      players?: Array<{
    player?: Ref<Jugador>;
    pre?: number;
    post?: number;
    delta?: number;
    teamColor?: TeamColor;
    _id: string;
    }>;
      teamAverages?: {
        rojo?: number;
        azul?: number;
      };
    };
  };
  ratingDeltas?: Array<{
    player?: Ref<Jugador>;
    delta?: number;
    _id: string;
    }>;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanillaEquipo {
  partido: Ref<Partido>;
  equipo: Ref<Equipo>;
  modo: PlanillaEquipoModo;
  estado: PlanillaEquipoEstado;
  visibilidadObjetivo: PlanillaEquipoVisibilidadObjetivo;
  solicitudOficializacion?: Ref<SolicitudEdicion>;
  fuentePreferida: PlanillaEquipoFuentePreferida;
  notas?: string;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanillaEstadistica {
  planilla: Ref<PlanillaEquipo>;
  planillaSet: Ref<PlanillaSet> | null;
  planillaPresente: Ref<PlanillaPresente>;
  throws: number;
  hits: number;
  outs: number;
  catches: number;
  survive: boolean;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanillaPresente {
  planilla: Ref<PlanillaEquipo>;
  jugador: Ref<Jugador>;
  jugadorPartido: Ref<JugadorPartido> | null;
  numero?: number;
  rol: PlanillaPresenteRol;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanillaSet {
  planilla: Ref<PlanillaEquipo>;
  numeroSet: number;
  ganadorSet: PlanillaSetGanadorSet;
  setPartido: Ref<SetPartido> | null;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlayerRating {
  playerId: Ref<Jugador>;
  competenciaId?: Ref<Competencia>;
  temporadaId?: Ref<Temporada>;
  modalidad?: string;
  categoria?: string;
  rating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  lastDelta: number;
  updatedAt: string;
  meta?: unknown;
  _id: string;
  createdAt?: string;
}

export interface ResultadoTest {
  equipo: Ref<Equipo>;
  jugador: Ref<Jugador>;
  tipoTest: Ref<TipoTest>;
  fecha: string;
  valor: number;
  entrenamiento: Ref<Entrenamiento> | null;
  notas: string;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sede {
  nombre: string;
  direccion: string;
  coordenadas?: {
    lat?: number;
    lng?: number;
  };
  canchas?: Array<string>;
  organizacion: Ref<Organizacion> | null;
  creadoPor: string;
  administradores?: Array<string>;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SetPartido {
  partido: Ref<Partido>;
  numeroSet: number;
  ganadorSet: SetPartidoGanadorSet;
  estadoSet: SetPartidoEstadoSet;
  timerSetValue: number;
  timerSetRunning: boolean;
  timerSetLastUpdate: string;
  timerSuddenDeathValue: number;
  timerSuddenDeathRunning: boolean;
  suddenDeathMode: boolean;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  duracionReal: number | null;
  duracionSetTimer: number | null;
  duracionSuddenDeath: number | null;
  meta?: unknown;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SolicitudEdicion {
  tipo: SolicitudEdicionTipo;
  entidad?: string;
  datosPropuestos: unknown;
  estado: SolicitudEdicionEstado;
  aceptadoPor?: Array<string>;
  requiereDobleConfirmacion: boolean;
  motivoRechazo?: string;
  fechaAceptacion?: string;
  fechaRechazo?: string;
  creadoPor: string;
  aprobadoPor?: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Temporada {
  competencia: Ref<Competencia>;
  nombre: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado: TemporadaEstado;
  ganador: Ref<Equipo> | null;
  creadoPor: string;
  administradores?: Array<string>;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TipoTest {
  equipo: Ref<Equipo>;
  nombre: string;
  unidad: string;
  mejorEs: TipoTestMejorEs;
  decimales: number;
  descripcion: string;
  activo: boolean;
  creadoPor: string;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TokenUsuario {
  usuario: string;
  tipo: TokenUsuarioTipo;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Usuario {
  _id: string;
  email: string;
  nombre: string;
  rol: UsuarioRol;
  passwordHash?: string;
  provider: UsuarioProvider;
  firebaseUid?: string;
  emailVerificado: boolean;
  emailVerificadoEn: string | null;
}
