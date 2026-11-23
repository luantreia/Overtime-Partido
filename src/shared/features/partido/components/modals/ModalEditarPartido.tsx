import { useEffect, useState } from 'react';
import ModalBase from '../../../../components/ModalBase/ModalBase';
import { useToast } from '../../../../components/Toast/ToastProvider';
import { authFetch } from '../../../../utils/authFetch';
import type { Partido } from '../../types/partido';
import type { PartidoEstado } from '../../../../types/modelos.generado';

type ModalEditarPartidoProps = {
  partido: Partido | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const toDatetimeLocal = (fecha?: string) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const ModalEditarPartido = ({ partido, isOpen, onClose, onSaved }: ModalEditarPartidoProps) => {
  const { addToast } = useToast();
  const [estado, setEstado] = useState<PartidoEstado>('programado');
  const [fecha, setFecha] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && partido) {
      setEstado((partido.estado as PartidoEstado) || 'programado');
      setFecha(toDatetimeLocal(partido.fecha));
    }
  }, [isOpen, partido]);

  const handleGuardar = async () => {
    if (!partido) return;
    try {
      setSaving(true);
      await authFetch(`/partidos/${partido._id}`, {
        method: 'PUT',
        body: { estado, fecha },
      });
      addToast({ type: 'success', message: 'Partido actualizado' });
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'No pudimos actualizar el partido' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Editar partido" size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="modaleditarpartido-estado" className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <select id="modaleditarpartido-estado"
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            value={estado}
            onChange={(e) => setEstado(e.target.value as PartidoEstado)}
          >
            <option value="programado">Programado</option>
            <option value="en_juego">En juego</option>
            <option value="finalizado">Finalizado</option>
            <option value="suspendido">Suspendido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label htmlFor="modaleditarpartido-fecha-y-hora" className="block text-sm font-medium text-slate-700 mb-1">Fecha y hora</label>
          <input id="modaleditarpartido-fecha-y-hora"
            type="datetime-local"
            className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold shadow-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

export default ModalEditarPartido;
