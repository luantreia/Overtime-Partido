import { useEffect, useMemo, useState } from 'react';
import ModalBase from '../../../../components/ModalBase/ModalBase';
import ConfirmModal from '../../../../components/ConfirmModal/ConfirmModal';
import { useToast } from '../../../../components/Toast/ToastProvider';
import {
  obtenerSetsDePartido,
  crearSetPartido,
  actualizarSetPartido,
  eliminarSetPartido,
} from '../../services/partidoService';
import type { SetPartido } from '../../types/partido';

type ModalGestionSetsProps = {
  partidoId: string;
  isOpen: boolean;
  onClose: () => void;
  onAbrirCaptura?: (numeroSet: number) => void;
};

const estados = ['pendiente', 'en_juego', 'finalizado'] as const;
const ganadores = ['local', 'visitante', 'pendiente'] as const;

const ModalGestionSets = ({ partidoId, isOpen, onClose, onAbrirCaptura }: ModalGestionSetsProps) => {
  const { addToast } = useToast();
  const [sets, setSets] = useState<SetPartido[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<{ open: boolean; setId?: string; numero?: number }>({ open: false });

  const numerosExistentes = useMemo(() => sets.map(s => s.numeroSet).sort((a,b) => a-b), [sets]);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await obtenerSetsDePartido(partidoId);
      setSets(data);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar los sets' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void cargar();
  }, [isOpen, partidoId]);

  const crearSet = async () => {
    try {
      // siguiente numero disponible
      let numero = 1;
      for (let i = 0; i < numerosExistentes.length; i++) {
        if (numerosExistentes[i] === numero) numero++;
        else break;
      }
      const creado = await crearSetPartido(partidoId, { numeroSet: numero, estadoSet: 'en_juego', ganadorSet: 'pendiente' });
      setSets(prev => [...prev, creado].sort((a,b) => a.numeroSet - b.numeroSet));
      addToast({ type: 'success', title: 'Set creado', message: `Se creó el set #${creado.numeroSet}` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos crear el set' });
    }
  };

  const actualizarCampo = async (setItem: SetPartido, cambios: Partial<SetPartido>) => {
    try {
      setSavingId(setItem._id);
      const actualizado = await actualizarSetPartido(partidoId, setItem._id, cambios);
      setSets(prev => prev.map(s => s._id === actualizado._id ? actualizado : s));
      addToast({ type: 'success', title: 'Actualizado', message: `Set #${setItem.numeroSet} actualizado` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos actualizar el set' });
    } finally {
      setSavingId(null);
    }
  };

  const solicitarEliminar = (setItem: SetPartido) => {
    // por seguridad: solo permitir eliminar ultimo
    const ultimo = Math.max(...sets.map(s => s.numeroSet));
    if (setItem.numeroSet !== ultimo) {
      addToast({ type: 'info', title: 'No permitido', message: 'Solo se puede eliminar el último set' });
      return;
    }
    setConfirmEliminar({ open: true, setId: setItem._id, numero: setItem.numeroSet });
  };

  const confirmarEliminar = async () => {
    const { setId, numero } = confirmEliminar;
    if (!setId) return;
    try {
      await eliminarSetPartido(partidoId, setId);
      setSets(prev => prev.filter(s => s._id !== setId));
      addToast({ type: 'success', title: 'Eliminado', message: `Set #${numero} eliminado` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error', message: 'No pudimos eliminar el set' });
    } finally {
      setConfirmEliminar({ open: false });
    }
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Gestionar sets" size="lg" bodyClassName="p-0">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Crear, editar y eliminar sets del partido.</p>
          <button type="button" onClick={crearSet} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">Nuevo set</button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        ) : sets.length === 0 ? (
          <p className="text-sm text-slate-500">No hay sets. Creá el primero.</p>
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
                {sets.sort((a,b) => a.numeroSet - b.numeroSet).map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{s.numeroSet}</td>
                    <td className="px-3 py-2">
                      <select
                        value={s.estadoSet}
                        onChange={(e) => actualizarCampo(s, { estadoSet: e.target.value })}
                        disabled={savingId === s._id}
                        className="rounded border border-slate-300 px-2 py-1 text-sm"
                      >
                        {estados.map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={s.ganadorSet}
                        onChange={(e) => actualizarCampo(s, { ganadorSet: e.target.value })}
                        disabled={savingId === s._id}
                        className="rounded border border-slate-300 px-2 py-1 text-sm"
                      >
                        {ganadores.map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right space-x-2">
                      {onAbrirCaptura ? (
                        <button
                          type="button"
                          onClick={() => onAbrirCaptura(s.numeroSet)}
                          className="rounded border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
                        >
                          Capturar
                        </button>
                      ) : null}
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

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-slate-300 hover:text-slate-900">Cerrar</button>
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
    </ModalBase>
  );
};

export default ModalGestionSets;
