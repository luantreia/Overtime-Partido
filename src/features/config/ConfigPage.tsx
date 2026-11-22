import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../shared/utils/authFetch';
import { useToast } from '../../shared/components/Toast/ToastProvider';
import ConfirmModal from '../../shared/components/ConfirmModal/ConfirmModal';
import { PartidoTable } from '../../shared/features/partido/components/PartidoTable';
import { Partido } from '../../shared/features/partido/types/partido';
import { ModalEditarPartido } from '../../shared/features/partido/components/modals/ModalEditarPartido';
import { ModalEditarResultado } from '../../shared/features/partido/components/modals/ModalEditarResultado';
import { ModalAlineacionPartido } from '../../shared/features/partido/components/modals/ModalAlineacionPartido';
import { EstadisticasPartidoModal } from '../../shared/components/EstadisticasPartidoModal';

type EstadoFiltro = 'activos' | 'programado' | 'en_juego' | 'finalizado' | 'cancelado' | 'todos';

const ESTADOS_ACTIVOS: Array<Partido['estado']> = ['programado', 'en_juego'];

export const ConfigPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('activos');

  const [partidoEnEdicion, setPartidoEnEdicion] = useState<Partido | null>(null);
  const [partidoEnResultado, setPartidoEnResultado] = useState<Partido | null>(null);
  const [partidoEnPlanilla, setPartidoEnPlanilla] = useState<Partido | null>(null);
  const [partidoEnStats, setPartidoEnStats] = useState<Partido | null>(null);
  const [partidoAIniciar, setPartidoAIniciar] = useState<Partido | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [roomId, setRoomId] = useState<string>(() => localStorage.getItem('overtime_partido_room') || 'cancha-1');

  useEffect(() => {
    localStorage.setItem('overtime_partido_room', roomId);
  }, [roomId]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const partidosData = await authFetch<Partido[]>('/partidos/admin');
      setPartidos(Array.isArray(partidosData) ? partidosData : []);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const conteos = useMemo(() => {
    const c: Record<string, number> = { programado: 0, en_juego: 0, finalizado: 0, cancelado: 0 };
    partidos.forEach((p) => {
      const estado = p.estado || 'programado';
      c[estado] = (c[estado] || 0) + 1;
    });
    c.activos = c.programado + c.en_juego;
    c.todos = partidos.length;
    return c;
  }, [partidos]);

  const visiblePartidos = useMemo(() => {
    if (filtroEstado === 'todos') return partidos;
    if (filtroEstado === 'activos') return partidos.filter((p) => ESTADOS_ACTIVOS.includes(p.estado));
    return partidos.filter((p) => p.estado === filtroEstado);
  }, [partidos, filtroEstado]);

  const goToControl = (matchId: string) => navigate(`/control?matchId=${matchId}`);
  const goToBroadcast = (matchId: string) => navigate(`/broadcast?matchId=${matchId}`);
  const openOverlay = (matchId: string) => window.open(`/overlay?matchId=${matchId}`, '_blank');

  const assignToRoom = async (matchId: string) => {
    const room = roomId.trim();
    if (!room) {
      addToast({ type: 'error', message: 'Definí un nombre de sala primero' });
      return;
    }
    try {
      await authFetch(`/api/rooms/${encodeURIComponent(room)}/assign`, {
        method: 'POST',
        body: { matchId },
      });
      addToast({ type: 'success', message: `Partido asignado a la sala "${room}"` });
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'No pudimos asignar el partido a la sala' });
    }
  };

  const copyRoomOverlayUrl = async () => {
    const room = roomId.trim();
    if (!room) {
      addToast({ type: 'error', message: 'Definí un nombre de sala primero' });
      return;
    }
    const url = `${window.location.origin}/overlay?room=${encodeURIComponent(room)}`;
    try {
      await navigator.clipboard.writeText(url);
      addToast({ type: 'success', message: 'URL de overlay de sala copiada' });
    } catch (error) {
      addToast({ type: 'error', message: `No se pudo copiar. URL: ${url}` });
    }
  };

  const handleIniciarPartido = async () => {
    if (!partidoAIniciar) return;
    try {
      setIniciando(true);
      await authFetch(`/partidos/${partidoAIniciar._id}`, {
        method: 'PUT',
        body: { estado: 'en_juego' },
      });
      addToast({ type: 'success', message: 'Partido iniciado' });
      const matchId = partidoAIniciar._id;
      setPartidoAIniciar(null);
      await loadData();
      navigate(`/control?matchId=${matchId}`);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'No pudimos iniciar el partido' });
    } finally {
      setIniciando(false);
    }
  };

  const pills: { key: EstadoFiltro; label: string }[] = [
    { key: 'activos', label: 'Activos' },
    { key: 'programado', label: 'Programados' },
    { key: 'en_juego', label: 'En juego' },
    { key: 'finalizado', label: 'Finalizados' },
    { key: 'cancelado', label: 'Cancelados' },
    { key: 'todos', label: 'Todos' },
  ];

  // Una acción principal por estado (la que el operador hace el 90% de las veces); el resto, secundarias neutras.
  const BTN_PRI = 'min-h-[36px] px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700 text-xs font-semibold transition-colors';
  const BTN_SEC = 'min-h-[36px] px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors';

  const renderActions = (partido: Partido) => {
    switch (partido.estado) {
      case 'programado':
        return (
          <div className="flex gap-2 justify-end flex-wrap">
            <button
              onClick={() => setPartidoEnEdicion(partido)}
              className={BTN_SEC}
            >
              Editar
            </button>
            <button
              onClick={() => setPartidoAIniciar(partido)}
              className={BTN_PRI}
            >
              Iniciar partido
            </button>
          </div>
        );
      case 'en_juego':
        return (
          <div className="flex gap-2 justify-end flex-wrap">
            <button
              onClick={() => goToControl(partido._id)}
              className={BTN_PRI}
              title="Ir a Botonera"
            >
              Mesa
            </button>
            <button
              onClick={() => goToBroadcast(partido._id)}
              className={BTN_SEC}
              title="Ir a Broadcast"
            >
              Broadcast
            </button>
            <button
              onClick={() => openOverlay(partido._id)}
              className={BTN_SEC}
              title="Abrir Overlay"
            >
              Overlay
            </button>
            <button
              onClick={() => assignToRoom(partido._id)}
              className={BTN_SEC}
              title={`Asignar este partido a la sala "${roomId}" (para que el overlay en OBS lo siga sin cambiar la URL)`}
            >
              📡 A la sala
            </button>
            <button
              onClick={() => setPartidoEnPlanilla(partido)}
              className={BTN_SEC}
            >
              Planilla
            </button>
            <button
              onClick={() => setPartidoEnStats(partido)}
              className={BTN_SEC}
              title="Ver Estadísticas"
            >
              Stats
            </button>
            <button
              onClick={() => setPartidoEnEdicion(partido)}
              className={BTN_SEC}
            >
              Editar
            </button>
          </div>
        );
      case 'finalizado':
        return (
          <div className="flex gap-2 justify-end flex-wrap">
            <button
              onClick={() => setPartidoEnResultado(partido)}
              className={BTN_SEC}
            >
              Editar resultado
            </button>
            <button
              onClick={() => setPartidoEnStats(partido)}
              className={BTN_PRI}
              title="Ver Estadísticas"
            >
              Stats
            </button>
          </div>
        );
      case 'cancelado':
        return <span className="text-xs text-muted italic">Partido cancelado</span>;
      default:
        return null;
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Partidos</h1>
          <p className="text-gray-500 mt-1">Gestión de encuentros y transmisiones</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label htmlFor="configpage-campo-247" className="block text-xs font-medium text-slate-500 mb-1">
            Sala de overlay (URL fija para OBS)
          </label>
          <input id="configpage-campo-247"
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="ej: cancha-1"
            className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
          />
        </div>
        <button
          onClick={copyRoomOverlayUrl}
          className="px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 text-sm font-medium transition-colors whitespace-nowrap"
        >
          📋 Copiar URL de sala
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {pills.map((pill) => (
          <button
            key={pill.key}
            onClick={() => setFiltroEstado(pill.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filtroEstado === pill.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {pill.label}
            <span className={`ml-1.5 ${filtroEstado === pill.key ? 'text-blue-100' : 'text-muted'}`}>
              ({conteos[pill.key] ?? 0})
            </span>
          </button>
        ))}
      </div>

      <PartidoTable
        partidos={visiblePartidos}
        selectedIds={selectedIds}
        onToggleSelect={(id) => {
          const newSelected = new Set(selectedIds);
          if (newSelected.has(id)) newSelected.delete(id);
          else newSelected.add(id);
          setSelectedIds(newSelected);
        }}
        onToggleSelectAll={() => {
          if (selectedIds.size === visiblePartidos.length) setSelectedIds(new Set());
          else setSelectedIds(new Set(visiblePartidos.map((p) => p._id)));
        }}
        onEdit={() => {}}
        onDelete={() => {}}
        renderActions={renderActions}
      />

      <ModalEditarPartido
        partido={partidoEnEdicion}
        isOpen={!!partidoEnEdicion}
        onClose={() => setPartidoEnEdicion(null)}
        onSaved={loadData}
      />

      <ModalEditarResultado
        partido={partidoEnResultado}
        isOpen={!!partidoEnResultado}
        onClose={() => setPartidoEnResultado(null)}
        onSaved={loadData}
      />

      {partidoEnPlanilla ? (
        <ModalAlineacionPartido
          partidoId={partidoEnPlanilla._id}
          isOpen={!!partidoEnPlanilla}
          onClose={() => setPartidoEnPlanilla(null)}
        />
      ) : null}

      {partidoEnStats ? (
        <EstadisticasPartidoModal
          isOpen={!!partidoEnStats}
          onClose={() => setPartidoEnStats(null)}
          partidoId={partidoEnStats._id}
          partido={{ _id: partidoEnStats._id, modoEstadisticas: partidoEnStats.modoEstadisticas }}
        />
      ) : null}

      <ConfirmModal
        isOpen={!!partidoAIniciar}
        onCancel={() => setPartidoAIniciar(null)}
        onConfirm={handleIniciarPartido}
        title="Iniciar partido"
        message="¿Iniciar este partido ahora? Se habilitará la mesa de control."
        confirmLabel={iniciando ? 'Iniciando…' : 'Iniciar'}
        cancelLabel="Cancelar"
        variant="primary"
      />
    </div>
  );
};
