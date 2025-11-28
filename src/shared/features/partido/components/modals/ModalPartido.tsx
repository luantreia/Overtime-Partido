import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/ui/Modal/Modal';
import { PartidoDetallado } from '../../types/partido';
// Import sections (placeholders for now)
// import { SeccionEstadisticasGenerales } from '../sections/SeccionEstadisticasGenerales';
// import { SeccionEstadisticasSetASet } from '../sections/SeccionEstadisticasSetASet';

interface ModalPartidoProps {
  isOpen: boolean;
  onClose: () => void;
  partidoId: string;
  // Add other props as needed
}

export const ModalPartido: React.FC<ModalPartidoProps> = ({ isOpen, onClose, partidoId }) => {
  const [partido, setPartido] = useState<PartidoDetallado | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generales' | 'sets' | 'jugadores'>('generales');

  useEffect(() => {
    if (isOpen && partidoId) {
      // Load partido details
      // setPartido(...)
    }
  }, [isOpen, partidoId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles del Partido">
      <div className="flex flex-col gap-4">
        {/* Header with match info */}
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg">
          <div className="text-center">
            <div className="font-bold">{partido?.equipoLocal?.nombre || 'Local'}</div>
            <div className="text-2xl font-bold">{partido?.marcadorLocal ?? '-'}</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-slate-400 font-bold">VS</div>
            <div className="text-xs text-slate-500">{partido?.estado || 'Programado'}</div>
            <button className="text-xs text-blue-600 hover:underline">Editar Datos</button>
          </div>
          <div className="text-center">
            <div className="font-bold">{partido?.equipoVisitante?.nombre || 'Visitante'}</div>
            <div className="text-2xl font-bold">{partido?.marcadorVisitante ?? '-'}</div>
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium text-slate-700 whitespace-nowrap">
            Gestionar Sets
          </button>
          <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium text-slate-700 whitespace-nowrap">
            Capturar Estadísticas
          </button>
          <button className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-sm font-medium whitespace-nowrap">
            Solicitar Corrección
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            className={`px-4 py-2 ${activeTab === 'generales' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-500'}`}
            onClick={() => setActiveTab('generales')}
          >
            General
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'sets' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-500'}`}
            onClick={() => setActiveTab('sets')}
          >
            Sets
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'jugadores' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-500'}`}
            onClick={() => setActiveTab('jugadores')}
          >
            Jugadores
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[300px]">
          {activeTab === 'generales' && (
            <div>
              {/* <SeccionEstadisticasGenerales partido={partido} /> */}
              <p className="text-slate-500 italic">Estadísticas generales...</p>
            </div>
          )}
          {activeTab === 'sets' && (
            <div>
              {/* <SeccionEstadisticasSetASet partido={partido} /> */}
              <p className="text-slate-500 italic">Timeline de sets...</p>
            </div>
          )}
          {activeTab === 'jugadores' && (
            <div>
              <p className="text-slate-500 italic">Estadísticas de jugadores...</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
