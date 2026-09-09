import { useState, useCallback, useEffect, type FC, type ReactNode } from 'react';
import { Overlay } from 'overtime-kit';
import { renderEstadisticasGenerales } from './EstadisticasGenerales';
import { renderEstadisticasEquipos } from './EstadisticasEquipos';
import { renderEstadisticasJugadores } from './EstadisticasJugadores';
import {
  getResumenEstadisticasAutomaticas,
  getResumenEstadisticasManual,
} from './estadisticasService';
import type {
  EstadisticaManualEquipo,
  EstadisticaManualJugador,
  EstadisticaSetResumen,
  ResumenEstadisticasAutomaticas,
  ResumenEstadisticasManual,
  ModoEstadisticas,
  EstadisticasGeneralesData,
  EstadisticasEquiposData,
  EstadisticasJugadoresData,
} from './types';

type VistaEstadisticas = 'general' | 'equipos' | 'jugadores';

interface EstadisticasPartidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  partidoId: string;
  partido?: {
    _id: string;
    modoEstadisticas?: ModoEstadisticas;
    modoVisualizacion?: ModoEstadisticas;
  };
}

interface EstadisticasData {
  jugadores: (EstadisticaManualJugador & { fuente?: string; setInfo?: Pick<EstadisticaSetResumen, 'numeroSet' | 'estadoSet' | 'ganadorSet'> })[];
  equipos: EstadisticaManualEquipo[];
  setsInfo?: EstadisticaSetResumen[];
  mensaje?: string;
  tipo?: string;
}

export const EstadisticasPartidoModal: FC<EstadisticasPartidoModalProps> = ({
  isOpen,
  onClose,
  partidoId,
  partido,
}) => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasData>({ jugadores: [], equipos: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [vista, setVista] = useState<VistaEstadisticas>('general');
  const [modoEstadisticasUI, setModoEstadisticasUI] = useState<ModoEstadisticas>(
    partido?.modoEstadisticas ?? 'automatico',
  );

  const cargarEstadisticas = useCallback(async (): Promise<void> => {
    try {
      console.log(`📊 Cargando estadísticas en modo ${modoEstadisticasUI}:`);
      setLoading(true);
      let data: EstadisticasData = { jugadores: [], equipos: [] };

      if (modoEstadisticasUI === 'automatico') {
        const dataSets: ResumenEstadisticasAutomaticas = await getResumenEstadisticasAutomaticas(partidoId);
        data = {
          jugadores: (dataSets.sets ?? []).flatMap(set =>
            (set.estadisticas ?? []).map(stat => ({
              ...stat,
              fuente: 'automatica',
              setInfo: { numeroSet: set.numeroSet, estadoSet: set.estadoSet, ganadorSet: set.ganadorSet },
            }))
          ),
          equipos: [], // Calcular agregados si es necesario
          setsInfo: dataSets.sets,
        };
      } else {
        const dataManual: ResumenEstadisticasManual = await getResumenEstadisticasManual(partidoId);
        data = {
          jugadores: (dataManual.jugadores ?? []).map(j => ({ ...j, fuente: 'manual' })),
          equipos: dataManual.equipos ?? [],
          mensaje: dataManual.mensaje,
          tipo: dataManual.tipo,
        };
      }

      setEstadisticas(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  }, [modoEstadisticasUI, partidoId]);

  useEffect(() => {
    if (isOpen) {
      cargarEstadisticas();
    }
  }, [isOpen, modoEstadisticasUI, partidoId, cargarEstadisticas]);

  const renderVistaActual = (): ReactNode => {
    if (loading) {
      return <div className="text-center py-8">Cargando estadísticas...</div>;
    }

    switch (vista) {
      case 'general':
        return renderEstadisticasGenerales(estadisticas as EstadisticasGeneralesData, partido, modoEstadisticasUI);
      case 'equipos':
        return renderEstadisticasEquipos(estadisticas as EstadisticasEquiposData, partido);
      case 'jugadores':
        return renderEstadisticasJugadores(estadisticas as EstadisticasJugadoresData, partido);
      default:
        return null;
    }
  };

  return (
    <Overlay
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title="Estadísticas del Partido"
      bodyScroll={false}
    >
      {/* Controles */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setVista('general')}
            className={`px-4 py-2 rounded ${vista === 'general' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            General
          </button>
          <button
            onClick={() => setVista('equipos')}
            className={`px-4 py-2 rounded ${vista === 'equipos' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Por Equipos
          </button>
          <button
            onClick={() => setVista('jugadores')}
            className={`px-4 py-2 rounded ${vista === 'jugadores' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Por Jugadores
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="modo"
              checked={modoEstadisticasUI === 'automatico'}
              onChange={() => setModoEstadisticasUI('automatico')}
              className="mr-2"
            />
            Automático
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="modo"
              checked={modoEstadisticasUI === 'manual'}
              onChange={() => setModoEstadisticasUI('manual')}
              className="mr-2"
            />
            Manual
          </label>
        </div>
      </div>

      {/* Contenido */}
      <div className="overflow-y-auto max-h-[60vh]">
        {renderVistaActual()}
      </div>
    </Overlay>
  );
};
