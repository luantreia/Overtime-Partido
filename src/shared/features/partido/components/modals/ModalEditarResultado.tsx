import { useEffect, useMemo, useState } from 'react';
import ModalBase from '../../../../components/ModalBase/ModalBase';
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal';
import { useToast } from '../../../../components/Toast/ToastProvider';
import { authFetch } from '../../../../utils/authFetch';
import {
  listSets,
  finishSetApi,
  reopenSetApi,
  deleteSetApi,
  changeWinnerApi,
  type SetPartidoDTO,
} from '../../services/setService';
import { ModalAlineacionPartido } from './ModalAlineacionPartido';
import type { Partido } from '../../types/partido';

type ModalEditarResultadoProps = {
  partido: Partido | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export const ModalEditarResultado = ({ partido, isOpen, onClose, onSaved }: ModalEditarResultadoProps) => {
  const { addToast } = useToast();
  const [marcadorLocal, setMarcadorLocal] = useState<number>(0);
  const [marcadorVisitante, setMarcadorVisitante] = useState<number>(0);
  const [savingMarcador, setSavingMarcador] = useState(false);
  const [sets, setSets] = useState<SetPartidoDTO[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState<{ open: boolean; setId?: string; numero?: number }>({ open: false });
  const [isAlineacionOpen, setIsAlineacionOpen] = useState(false);

  const partidoId = partido?._id;

  const cargarSets = async (id: string) => {
    try {
      setLoadingSets(true);
      const data = await listSets(id);
      setSets(Array.isArray(data) ? data.sort((a, b) => a.numeroSet - b.numeroSet) : []);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'No pudimos cargar los sets' });
    } finally {
      setLoadingSets(false);
    }
  };

  useEffect(() => {
    if (isOpen && partido) {
      setMarcadorLocal(partido.marcadorLocal ?? 0);
      setMarcadorVisitante(partido.marcadorVisitante ?? 0);
      if (partido._id) void cargarSets(partido._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, partido]);

  const ultimoNumeroSet = useMemo(() => (sets.length ? Math.max(...sets.map((s) => s.numeroSet)) : undefined), [sets]);

  const handleGuardarMarcador = async () => {
    if (!partidoId) return;
    try {
      setSavingMarcador(true);
      await authFetch(`/partidos/${partidoId}`, {
        method: 'PUT',
        body: {
          marcadorLocal,
          marcadorVisitante,
          marcadorModificadoManualmente: true,
        },
      });
      addToast({ type: 'success', message: 'Marcador actualizado' });
      onSaved();
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'No pudimos actualizar el marcador' });
    } finally {
      setSavingMarcador(false);
    }
  };

  const handleRecalcular = async () => {
    if (!partidoId) return;
    try {
      await authFetch(`/partidos/${partidoId}/recalcular-marcador`, { method: 'PUT' });
      addToast({ type: 'success', message: 'Marcador recalculado desde los sets' });
      onSaved();
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'No pudimos recalcular el marcador' });
    }
  };

  const handleReabrir = async (setId: string) => {
    try {
      await reopenSetApi(setId);
      addToast({ type: 'success', message: 'Set reabierto' });
      if (partidoId) void cargarSets(partidoId);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'No pudimos reabrir el set' });
    }
  };

  const handleFinalizar = async (setId: string, ganador: 'local' | 'visitante' | 'empate') => {
    try {
      await finishSetApi(setId, ganador);
      addToast({ type: 'success', message: 'Set finalizado' });
      if (partidoId) void cargarSets(partidoId);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'No pudimos finalizar el set' });
    }
  };

  const handleCambiarGanador = async (setId: string, ganador: 'local' | 'visitante' | 'empate') => {
    try {
      await changeWinnerApi(setId, ganador);
      addToast({ type: 'success', message: 'Ganador actualizado' });
      if (partidoId) void cargarSets(partidoId);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'No pudimos cambiar el ganador' });
    }
  };

  const solicitarEliminar = (s: SetPartidoDTO) => {
    if (ultimoNumeroSet !== undefined && s.numeroSet !== ultimoNumeroSet) {
      addToast({ type: 'info', message: 'Solo se puede eliminar el último set' });
      return;
    }
    setConfirmEliminar({ open: true, setId: s._id, numero: s.numeroSet });
  };

  const confirmarEliminar = async () => {
    const { setId, numero } = confirmEliminar;
    if (!setId) return;
    try {
      await deleteSetApi(setId);
      addToast({ type: 'success', message: `Set #${numero} eliminado` });
      if (partidoId) void cargarSets(partidoId);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'No pudimos eliminar el set' });
    } finally {
      setConfirmEliminar({ open: false });
    }
  };

  if (!partido) return null;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Editar resultado" size="lg" bodyClassName="p-0">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
          <div className="text-center flex-1">
            <div className="font-bold text-slate-800">{partido.equipoLocal?.nombre || 'Local'}</div>
            <input
              type="number"
              min={0}
              value={marcadorLocal}
              onChange={(e) => setMarcadorLocal(Number(e.target.value))}
              className="mt-2 w-20 text-center text-2xl font-bold border border-slate-300 rounded-lg p-1"
            />
          </div>
          <div className="text-slate-400 font-bold px-4">VS</div>
          <div className="text-center flex-1">
            <div className="font-bold text-slate-800">{partido.equipoVisitante?.nombre || 'Visitante'}</div>
            <input
              type="number"
              min={0}
              value={marcadorVisitante}
              onChange={(e) => setMarcadorVisitante(Number(e.target.value))}
              className="mt-2 w-20 text-center text-2xl font-bold border border-slate-300 rounded-lg p-1"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={handleRecalcular}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            Recalcular marcador desde sets
          </button>
          <button
            type="button"
            onClick={() => setIsAlineacionOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
          >
            Ver/editar planilla
          </button>
          <button
            type="button"
            onClick={handleGuardarMarcador}
            disabled={savingMarcador}
            className="px-4 py-1.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {savingMarcador ? 'Guardando…' : 'Guardar marcador'}
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Sets</h3>
          {loadingSets ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-slate-200" />
              ))}
            </div>
          ) : sets.length === 0 ? (
            <p className="text-sm text-slate-500">No hay sets registrados.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                    <th className="px-3 py-2 text-left">Ganador</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sets.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium">{s.numeroSet}</td>
                      <td className="px-3 py-2">{s.estadoSet}</td>
                      <td className="px-3 py-2">
                        <select
                          value={s.ganadorSet}
                          onChange={(e) => handleCambiarGanador(s._id, e.target.value as 'local' | 'visitante' | 'empate')}
                          className="rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="local">Local</option>
                          <option value="visitante">Visitante</option>
                          <option value="empate">Empate</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                        {s.estadoSet === 'finalizado' ? (
                          <button
                            type="button"
                            onClick={() => handleReabrir(s._id)}
                            className="rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
                          >
                            Reabrir
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleFinalizar(s._id, (s.ganadorSet === 'local' || s.ganadorSet === 'visitante' || s.ganadorSet === 'empate') ? s.ganadorSet : 'local')}
                            className="rounded border border-emerald-300 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50"
                          >
                            Finalizar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => solicitarEliminar(s)}
                          className="rounded border border-rose-300 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            Cerrar
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmEliminar.open}
        onCancel={() => setConfirmEliminar({ open: false })}
        onConfirm={confirmarEliminar}
        title={`Eliminar set ${confirmEliminar.numero ?? ''}`}
        message="¿Seguro que querés eliminar este set? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {partidoId ? (
        <ModalAlineacionPartido
          partidoId={partidoId}
          isOpen={isAlineacionOpen}
          onClose={() => setIsAlineacionOpen(false)}
        />
      ) : null}
    </ModalBase>
  );
};

export default ModalEditarResultado;
