import { useEffect, useMemo, useState } from 'react';
import ModalBase from '../../../../components/ModalBase/ModalBase';
import { getAlineacion, guardarAlineacion, crearJugadorPartido, eliminarJugadorPartido, getPartidoDetallado } from '../../services/alineacionService';
import { getJugadoresEquipo } from '../../services/jugadorEquipoService';
import type { Jugador, JugadorPartido } from '../../../../../types';
import { useToast } from '../../../../components/Toast/ToastProvider';

type RolAlineacion = 'jugador' | 'entrenador' | 'ninguno';

type JugadorOption = {
  id: string;
  nombre: string;
  numeroCamiseta?: number;
};

type ModalAlineacionPartidoProps = {
  partidoId: string;
  equipoId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (jugadores: JugadorPartido[]) => void;
};

const getJugadorId = (jugador: unknown): string => {
  if (!jugador) return '';
  if (typeof jugador === 'string') return jugador;
  const j = jugador as { id?: string; _id?: string };
  return j.id ?? j._id ?? '';
};

const getJugadorNombre = (jugador: unknown): string => {
  if (!jugador) return 'Jugador';
  if (typeof jugador === 'string') return 'Jugador';
  const j = jugador as { nombre?: string; alias?: string };
  return j.nombre ?? j.alias ?? 'Jugador';
};

const mapJugadorOption = (jugador: Jugador): JugadorOption => ({
  id: jugador.id,
  nombre: jugador.nombre,
  numeroCamiseta: jugador.numeroCamiseta,
});

const buildInitialRoles = (alineacion: JugadorPartido[]): Record<string, RolAlineacion> => {
  const roles: Record<string, RolAlineacion> = {};
  const normalize = (r: unknown): RolAlineacion => (r === 'entrenador' ? 'entrenador' : r === 'jugador' ? 'jugador' : 'jugador');
  alineacion.forEach((item) => {
    const jid = getJugadorId((item as any).jugador);
    if (jid) roles[jid] = normalize((item as any).rol);
  });
  return roles;
};

const isRolAsignable = (rol: RolAlineacion): rol is Exclude<RolAlineacion, 'ninguno'> =>
  rol === 'jugador' || rol === 'entrenador';

export const ModalAlineacionPartido = ({
  partidoId,
  equipoId,
  isOpen,
  onClose,
  onSaved,
}: ModalAlineacionPartidoProps) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jugadoresLocal, setJugadoresLocal] = useState<JugadorOption[]>([]);
  const [jugadoresVisitante, setJugadoresVisitante] = useState<JugadorOption[]>([]);
  const [equipoLocalId, setEquipoLocalId] = useState<string | undefined>(undefined);
  const [equipoVisitanteId, setEquipoVisitanteId] = useState<string | undefined>(undefined);
  const [equipoLocalNombre, setEquipoLocalNombre] = useState<string>('Equipo Local');
  const [equipoVisitanteNombre, setEquipoVisitanteNombre] = useState<string>('Equipo Visitante');
  const [alineacion, setAlineacion] = useState<JugadorPartido[]>([]);
  const [rolesPorJugador, setRolesPorJugador] = useState<Record<string, RolAlineacion>>({});
  const [jugadorPartidoPorJugador, setJugadorPartidoPorJugador] = useState<Record<string, string>>({});
  const [nuevoJugadorLocalId, setNuevoJugadorLocalId] = useState<string>('');
  const [nuevoJugadorVisitanteId, setNuevoJugadorVisitanteId] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    let isActive = true;

    const cargar = async () => {
      try {
        setLoading(true);
        setError(null);

        const partido = await getPartidoDetallado(partidoId);
        const localId = (typeof partido.equipoLocal === 'string') ? partido.equipoLocal : partido.equipoLocal?._id;
        const visitanteId = (typeof partido.equipoVisitante === 'string') ? partido.equipoVisitante : partido.equipoVisitante?._id;

        const equipoLocalNombre = (typeof partido.equipoLocal === 'string') ? 'Local' : (partido.equipoLocal?.nombre ?? 'Local');
        const equipoVisitanteNombre = (typeof partido.equipoVisitante === 'string') ? 'Visitante' : (partido.equipoVisitante?.nombre ?? 'Visitante');

        const [alineacionActual, jugadoresEquipoLocal, jugadoresEquipoVisitante] = await Promise.all([
          getAlineacion(partidoId),
          localId ? getJugadoresEquipo({ equipoId: localId, estado: 'activo' }) : Promise.resolve([] as Jugador[]),
          visitanteId ? getJugadoresEquipo({ equipoId: visitanteId, estado: 'activo' }) : Promise.resolve([] as Jugador[]),
        ]);

        if (!isActive) return;

        setAlineacion(alineacionActual);
        setEquipoLocalId(localId);
        setEquipoVisitanteId(visitanteId);
        setEquipoLocalNombre(equipoLocalNombre);
        setEquipoVisitanteNombre(equipoVisitanteNombre);

        const opcionesLocal = jugadoresEquipoLocal.map(mapJugadorOption);
        const opcionesVisitante = jugadoresEquipoVisitante.map(mapJugadorOption);

        const extrasLocal = alineacionActual
          .filter((item) => (typeof item.equipo === 'string' ? item.equipo === localId : (item.equipo as any)?._id === localId))
          .filter((item) => !opcionesLocal.some((op) => op.id === getJugadorId((item as any).jugador)))
          .map((item) => ({ id: getJugadorId((item as any).jugador), nombre: getJugadorNombre((item as any).jugador) }));

        const extrasVisitante = alineacionActual
          .filter((item) => (typeof item.equipo === 'string' ? item.equipo === visitanteId : (item.equipo as any)?._id === visitanteId))
          .filter((item) => !opcionesVisitante.some((op) => op.id === getJugadorId((item as any).jugador)))
          .map((item) => ({ id: getJugadorId((item as any).jugador), nombre: getJugadorNombre((item as any).jugador) }));

        setJugadoresLocal([...opcionesLocal, ...extrasLocal]);
        setJugadoresVisitante([...opcionesVisitante, ...extrasVisitante]);
        setRolesPorJugador(buildInitialRoles(alineacionActual));
        setJugadorPartidoPorJugador(
          alineacionActual.reduce<Record<string, string>>((acc, it) => {
            const jpId = (it as any)._id ?? (it as any).id;
            const jugadorId = getJugadorId((it as any).jugador);
            if (jpId && jugadorId) acc[jugadorId] = jpId as string;
            return acc;
          }, {})
        );
      } catch (err) {
        if (!isActive) return;
        console.error('Error al cargar alineación:', err);
        setError('No pudimos cargar la alineación. Intentá nuevamente.');
        addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar la alineación' });
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void cargar();

    return () => {
      isActive = false;
    };
  }, [equipoId, isOpen, partidoId, addToast]);

  const handleChangeRol = (jugadorId: string, rol: RolAlineacion) => {
    setRolesPorJugador((prev) => ({
      ...prev,
      [jugadorId]: rol,
    }));
  };

  const jugadoresTodos = useMemo(() => [...jugadoresLocal, ...jugadoresVisitante], [jugadoresLocal, jugadoresVisitante]);
  const jugadoresConRol = useMemo(
    () => jugadoresTodos.filter((j) => isRolAsignable(rolesPorJugador[j.id] as RolAlineacion)),
    [jugadoresTodos, rolesPorJugador],
  );

  const handleGuardar = async () => {
    try {
      setSaving(true);
      setError(null);

      const jugadoresPayload = Object.entries(rolesPorJugador).reduce(
        (acc, [jugadorId, rol]) => {
          if (isRolAsignable(rol)) {
            acc.push({ jugadorId, rol });
          }
          return acc;
        },
        [] as { jugadorId: string; rol: Exclude<RolAlineacion, 'ninguno'> }[],
      );

      const alineacionGuardada = await guardarAlineacion(partidoId, { jugadores: jugadoresPayload });
      onSaved?.(alineacionGuardada);
      addToast({ type: 'success', title: 'Alineación guardada', message: 'Los roles fueron actualizados' });
      onClose();
    } catch (err) {
      console.error('Error al guardar alineación:', err);
      setError('No pudimos guardar la alineación. Revisá los datos e intentá nuevamente.');
      addToast({ type: 'error', title: 'Error', message: 'No pudimos guardar la alineación' });
    } finally {
      setSaving(false);
    }
  };

  const handleCerrar = () => {
    if (!saving) {
      onClose();
    }
  };

  const opcionesAgregarLocal = useMemo(() => {
    const presentes = new Set(Object.keys(jugadorPartidoPorJugador));
    return jugadoresLocal.filter((j) => !presentes.has(j.id));
  }, [jugadoresLocal, jugadorPartidoPorJugador]);

  const opcionesAgregarVisitante = useMemo(() => {
    const presentes = new Set(Object.keys(jugadorPartidoPorJugador));
    return jugadoresVisitante.filter((j) => !presentes.has(j.id));
  }, [jugadoresVisitante, jugadorPartidoPorJugador]);

  const handleAgregarJugador = async (equipo: 'local' | 'visitante') => {
    try {
      const targetEquipoId = equipo === 'local' ? equipoLocalId : equipoVisitanteId;
      const jugadorId = equipo === 'local' ? nuevoJugadorLocalId : nuevoJugadorVisitanteId;
      if (!jugadorId || !targetEquipoId) return;
      const creado = await crearJugadorPartido({ partido: partidoId, jugador: jugadorId, equipo: targetEquipoId });
      setJugadorPartidoPorJugador((prev) => ({ ...prev, [creado.jugador as unknown as string]: creado._id }));
      setAlineacion((prev) => [...prev, (creado as unknown as JugadorPartido)]);
      // asegurar que aparezca en la lista si no estaba
      if (equipo === 'local') {
        if (!jugadoresLocal.some((j) => j.id === (creado.jugador as unknown as string))) {
          setJugadoresLocal((prev) => [...prev, { id: creado.jugador as unknown as string, nombre: 'Jugador' }]);
        }
        setNuevoJugadorLocalId('');
      } else {
        if (!jugadoresVisitante.some((j) => j.id === (creado.jugador as unknown as string))) {
          setJugadoresVisitante((prev) => [...prev, { id: creado.jugador as unknown as string, nombre: 'Jugador' }]);
        }
        setNuevoJugadorVisitanteId('');
      }
      addToast({ type: 'success', title: 'Agregado', message: 'Jugador agregado al partido' });
    } catch (err) {
      console.error('Error al agregar jugador al partido:', err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos agregar el jugador' });
    }
  };

  const handleQuitarJugador = async (jugadorId: string) => {
    const jpId = jugadorPartidoPorJugador[jugadorId];
    if (!jpId) return;
    try {
      await eliminarJugadorPartido(jpId);
      setJugadorPartidoPorJugador((prev) => {
        const next = { ...prev };
        delete next[jugadorId];
        return next;
      });
      setRolesPorJugador((prev) => ({ ...prev, [jugadorId]: 'ninguno' }));
      // quitar de la lista actual sin recargar
      setAlineacion((prev) => prev.filter((it) => ((it as any)._id ?? (it as any).id) !== jpId));
      addToast({ type: 'success', title: 'Quitado', message: 'Jugador removido del partido' });
    } catch (err) {
      console.error('Error al quitar jugador del partido:', err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos quitar el jugador' });
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleCerrar}
      title="Gestionar jugadores del partido"
      subtitle="Agregá, quitá o cambiá el rol de los jugadores"
      size="lg"
      bodyClassName="p-0"
    >
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-800">Agregar al {equipoLocalNombre}</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[220px]">
                <select
                  value={nuevoJugadorLocalId}
                  onChange={(e) => setNuevoJugadorLocalId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar…</option>
                  {opcionesAgregarLocal.map((op) => (
                    <option key={op.id} value={op.id}>{op.nombre}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleAgregarJugador('local')}
                disabled={!nuevoJugadorLocalId || !equipoLocalId}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-slate-800">Agregar al {equipoVisitanteNombre}</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[220px]">
                <select
                  value={nuevoJugadorVisitanteId}
                  onChange={(e) => setNuevoJugadorVisitanteId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar…</option>
                  {opcionesAgregarVisitante.map((op) => (
                    <option key={op.id} value={op.id}>{op.nombre}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleAgregarJugador('visitante')}
                disabled={!nuevoJugadorVisitanteId || !equipoVisitanteId}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p>Seleccioná el rol para cada jugador. Podés agregar jugadores por equipo o quitarlos del partido.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Local */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">{equipoLocalNombre}</h3>
                {alineacion.filter((it) => (typeof it.equipo === 'string' ? it.equipo === equipoLocalId : (it.equipo as any)?._id === equipoLocalId)).length === 0 ? (
                  <p className="text-sm text-slate-500">No hay jugadores asignados. Agregá jugadores del equipo.</p>
                ) : null}
                {alineacion
                  .filter((it) => (typeof it.equipo === 'string' ? it.equipo === equipoLocalId : (it.equipo as any)?._id === equipoLocalId))
                  .map((it) => {
                    const jid = getJugadorId((it as any).jugador);
                    const nombre = getJugadorNombre((it as any).jugador);
                    return (
                      <div key={(it as any)._id ?? jid} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="min-w-0 w-1/2 pr-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 whitespace-normal">{nombre}</p>
                            {(it as any).numero ? <p className="text-xs text-slate-500">#{(it as any).numero}</p> : null}
                          </div>
                        </div>
                        <div className="flex w-1/2 flex-wrap items-center justify-end gap-2">
                          <select
                            value={rolesPorJugador[jid] ?? ((it as any).rol as RolAlineacion) ?? 'ninguno'}
                            onChange={(event) => handleChangeRol(jid, event.target.value as RolAlineacion)}
                            className="w-32 sm:w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="ninguno">Sin asignar</option>
                            <option value="jugador">Jugador</option>
                            <option value="entrenador">Entrenador</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleQuitarJugador(jid)}
                            className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                            title="Quitar del partido"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Visitante */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">{equipoVisitanteNombre}</h3>
                {alineacion.filter((it) => (typeof it.equipo === 'string' ? it.equipo === equipoVisitanteId : (it.equipo as any)?._id === equipoVisitanteId)).length === 0 ? (
                  <p className="text-sm text-slate-500">No hay jugadores asignados. Agregá jugadores del equipo.</p>
                ) : null}
                {alineacion
                  .filter((it) => (typeof it.equipo === 'string' ? it.equipo === equipoVisitanteId : (it.equipo as any)?._id === equipoVisitanteId))
                  .map((it) => {
                    const jid = getJugadorId((it as any).jugador);
                    const nombre = getJugadorNombre((it as any).jugador);
                    return (
                      <div key={(it as any)._id ?? jid} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="min-w-0 w-1/2 pr-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 whitespace-normal">{nombre}</p>
                            {(it as any).numero ? <p className="text-xs text-slate-500">#{(it as any).numero}</p> : null}
                          </div>
                        </div>
                        <div className="flex w-1/2 flex-wrap items-center justify-end gap-2">
                          <select
                            value={rolesPorJugador[jid] ?? ((it as any).rol as RolAlineacion) ?? 'ninguno'}
                            onChange={(event) => handleChangeRol(jid, event.target.value as RolAlineacion)}
                            className="w-32 sm:w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="ninguno">Sin asignar</option>
                            <option value="jugador">Jugador</option>
                            <option value="entrenador">Entrenador</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleQuitarJugador(jid)}
                            className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                            title="Quitar del partido"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <p className="font-medium text-slate-900">Resumen</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Jugadores asignados: {jugadoresConRol.length}</li>
              </ul>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCerrar}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving || loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

export default ModalAlineacionPartido;
