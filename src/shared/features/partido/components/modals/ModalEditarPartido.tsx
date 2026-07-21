import { useEffect, useState } from 'react';
import ModalBase from '../../../../components/ModalBase/ModalBase';
import { useToast } from '../../../../components/Toast/ToastProvider';
import { authFetch } from '../../../../utils/authFetch';
import type { Partido } from '../../types/partido';

type EstadoPartido = 'programado' | 'en_juego' | 'finalizado' | 'cancelado';

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
  const [estado, setEstado] = useState<EstadoPartido>('programado');
  const [fecha, setFecha] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && partido) {
      setEstado((partido.estado as EstadoPartido) || 'programado');
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoPartido)}
          >
            <option value="programado">Programado</option>
            <option value="en_juego">En juego</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora</label>
          <input
            type="datetime-local"
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

export default ModalEditarPartido;
