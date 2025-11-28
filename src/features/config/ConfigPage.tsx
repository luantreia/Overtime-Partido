import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../shared/utils/authFetch';
import { useToast } from '../../shared/components/Toast/ToastProvider';
import { PartidoTable } from '../../shared/features/partido/components/PartidoTable';
import { Partido } from '../../shared/features/partido/types/partido';
import ModalBase from '../../shared/components/ModalBase/ModalBase';

interface Equipo {
  _id: string;
  nombre: string;
}

export const ConfigPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [localId, setLocalId] = useState('');
  const [visitanteId, setVisitanteId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 16));
  const [modalidad, setModalidad] = useState<'Foam' | 'Cloth'>('Foam');
  const [categoria, setCategoria] = useState<'Mixto' | 'Masculino' | 'Femenino' | 'Libre'>('Mixto');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partidosData, equiposData] = await Promise.all([
        authFetch<Partido[]>('/partidos/admin'),
        authFetch<Equipo[]>('/equipos')
      ]);
      setPartidos(partidosData);
      setEquipos(equiposData);
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localId || !visitanteId) {
      addToast({ type: 'error', message: 'Selecciona ambos equipos' });
      return;
    }
    if (localId === visitanteId) {
      addToast({ type: 'error', message: 'Los equipos deben ser distintos' });
      return;
    }
    // Validar fecha futura (al menos ahora + 1 minuto)
    const selectedDate = new Date(fecha);
    const now = new Date();
    if (selectedDate.getTime() < now.getTime() + 60_000) {
      addToast({ type: 'error', message: 'La fecha/hora debe ser futura (mínimo 1 minuto)' });
      return;
    }

    try {
      const localTeam = equipos.find(e => e._id === localId);
      const visitorTeam = equipos.find(e => e._id === visitanteId);
      const nombrePartido = `${localTeam?.nombre} vs ${visitorTeam?.nombre}`;

      await authFetch('/partidos', {
        method: 'POST',
        body: {
          equipoLocal: localId,
          equipoVisitante: visitanteId,
          fecha,
          modalidad,
          categoria,
          nombrePartido
        }
      });
      
      addToast({ type: 'success', message: 'Partido creado' });
      setIsCreateModalOpen(false);
      loadData(); // Reload list
      // Reset form
      setLocalId('');
      setVisitanteId('');
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', message: 'Error al crear partido' });
    }
  };

  const goToControl = (matchId: string) => {
    navigate(`/control?matchId=${matchId}`);
  };

  const goToBroadcast = (matchId: string) => {
    navigate(`/broadcast?matchId=${matchId}`);
  };

  const goToStats = (matchId: string) => {
    navigate(`/stats?matchId=${matchId}`);
  };

  const openOverlay = (matchId: string) => {
    window.open(`/overlay?matchId=${matchId}`, '_blank');
  };

  const visiblePartidos = partidos.filter(p => p.estado !== 'finalizado');

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partidos</h1>
          <p className="text-gray-500 mt-1">Gestión de encuentros y transmisiones</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Nuevo Partido
        </button>
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
          else setSelectedIds(new Set(visiblePartidos.map(p => p._id)));
        }}
        onEdit={() => {}} // No implemented yet in this view
        onDelete={() => {}} // No implemented yet in this view
        renderActions={(partido) => (
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => goToControl(partido._id)}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 text-xs font-medium transition-colors"
              title="Ir a Botonera"
            >
              Mesa
            </button>
            <button 
              onClick={() => goToBroadcast(partido._id)}
              className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded hover:bg-orange-100 text-xs font-medium transition-colors"
              title="Ir a Broadcast"
            >
              Broadcast
            </button>
            <button 
              onClick={() => goToStats(partido._id)}
              className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 text-xs font-medium transition-colors"
              title="Ver Estadísticas"
            >
              Stats
            </button>
            <button 
              onClick={() => openOverlay(partido._id)}
              className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 text-xs font-medium transition-colors"
              title="Abrir Overlay"
            >
              Overlay
            </button>
          </div>
        )}
      />

      <ModalBase
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Partido"
        size="md"
      >
        <div className="p-6">
          <form onSubmit={handleCreateMatch} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipo Local</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={localId}
                  onChange={e => setLocalId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {equipos.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipo Visitante</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={visitanteId}
                  onChange={e => setVisitanteId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {equipos.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
              <input 
                type="datetime-local" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={modalidad}
                  onChange={e => setModalidad(e.target.value as 'Foam' | 'Cloth')}
                >
                  <option value="Foam">Foam</option>
                  <option value="Cloth">Cloth</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={categoria}
                  onChange={e => setCategoria(e.target.value as 'Mixto' | 'Masculino' | 'Femenino' | 'Libre')}
                >
                  <option value="Mixto">Mixto</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Libre">Libre</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-colors"
              >
                Crear Partido
              </button>
            </div>

          </form>
        </div>
      </ModalBase>
    </div>
  );
};
