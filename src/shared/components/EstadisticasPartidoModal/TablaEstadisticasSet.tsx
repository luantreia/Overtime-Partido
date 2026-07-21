import { useState, useEffect, type FC } from 'react';
import { getEstadisticasJugadorSet } from './estadisticasService';
import type { EstadisticaJugadorSetDetalle } from './types';

type JugadorReferencia = {
  _id?: string;
  nombre?: string;
  apellido?: string;
};

type EquipoReferencia = {
  _id?: string;
  nombre?: string;
};

type EstadisticaJugadorSet = EstadisticaJugadorSetDetalle & {
  jugador?: JugadorReferencia | string;
  equipo?: EquipoReferencia | string;
};

type EquipoStats = {
  nombre: string;
  throws: number;
  hits: number;
  outs: number;
  catches: number;
  jugadores: EstadisticaJugadorSet[];
};

type TablaEstadisticasSetProps = {
  setId?: string;
};

const TablaEstadisticasSet: FC<TablaEstadisticasSetProps> = ({ setId }) => {
  const [estadisticas, setEstadisticas] = useState<EstadisticaJugadorSet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [equiposStats, setEquiposStats] = useState<Record<string, EquipoStats>>({});

  useEffect(() => {
    if (!setId) return;

    const cargarEstadisticas = async (): Promise<void> => {
      try {
        setLoading(true);
        const data = await getEstadisticasJugadorSet(setId);
        const estadisticasSet = Array.isArray(data) ? data : [];
        setEstadisticas(estadisticasSet);

        // Calcular totales por equipo
        const totalesPorEquipo: Record<string, EquipoStats> = {};
        estadisticasSet.forEach(stat => {
          const equipo = stat.equipo;
          const equipoId = typeof equipo === 'string' ? equipo : equipo?._id;
          const equipoNombre = typeof equipo === 'string' ? 'Equipo' : (equipo?.nombre ?? 'Equipo');

          const equipoKey = equipoId ?? 'sin-equipo';

          if (!totalesPorEquipo[equipoKey]) {
            totalesPorEquipo[equipoKey] = {
              nombre: equipoNombre,
              throws: 0,
              hits: 0,
              outs: 0,
              catches: 0,
              jugadores: [],
            };
          }

          totalesPorEquipo[equipoKey].throws += stat.throws || 0;
          totalesPorEquipo[equipoKey].hits += stat.hits || 0;
          totalesPorEquipo[equipoKey].outs += stat.outs || 0;
          totalesPorEquipo[equipoKey].catches += stat.catches || 0;
          totalesPorEquipo[equipoKey].jugadores.push(stat);
        });

        setEquiposStats(totalesPorEquipo);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar estadísticas';
        console.error('Error cargando estadísticas:', err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, [setId]);

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-600">
        <span className="text-sm">Cargando estadísticas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        <span className="text-sm">Error: {error}</span>
      </div>
    );
  }

  if (estadisticas.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <span className="text-sm">No hay estadísticas capturadas para este set</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-3">
      {Object.entries(equiposStats).map(([equipoId, equipoData]) => (
        <div key={equipoId} className="border rounded-lg overflow-hidden bg-white">
          {/* Header del equipo con totales */}
          <div className="bg-blue-600 text-white px-4 py-2">
            <h4 className="font-semibold">{equipoData.nombre}</h4>
            <div className="grid grid-cols-4 gap-2 mt-1 text-xs">
              <div>
                <span className="opacity-75">Lanzamientos:</span>
                <span className="ml-1 font-semibold">{equipoData.throws}</span>
              </div>
              <div>
                <span className="opacity-75">Golpes:</span>
                <span className="ml-1 font-semibold">{equipoData.hits}</span>
              </div>
              <div>
                <span className="opacity-75">Outs:</span>
                <span className="ml-1 font-semibold">{equipoData.outs}</span>
              </div>
              <div>
                <span className="opacity-75">Atrapadas:</span>
                <span className="ml-1 font-semibold">{equipoData.catches}</span>
              </div>
            </div>
          </div>

          {/* Tabla de jugadores */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Jugador
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Lanzamientos
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Golpes
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Outs
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Atrapadas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipoData.jugadores.map((stat, index) => {
                  let jugadorNombre = 'Jugador';

                  if (stat.jugador) {
                    if (typeof stat.jugador === 'object' && stat.jugador.nombre && stat.jugador.apellido) {
                      // Caso 1: Tiene nombre Y apellido separados
                      jugadorNombre = `${stat.jugador.nombre} ${stat.jugador.apellido}`;
                    } else if (typeof stat.jugador === 'object' && stat.jugador.nombre) {
                      // Caso 2: Solo tiene nombre completo en un campo
                      jugadorNombre = stat.jugador.nombre;
                    } else if (typeof stat.jugador === 'string') {
                      jugadorNombre = stat.jugador;
                    }
                  }

                  return (
                    <tr key={stat._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                        {jugadorNombre}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-center">
                        {stat.throws || 0}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-center">
                        {stat.hits || 0}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-center">
                        {stat.outs || 0}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-center">
                        {stat.catches || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TablaEstadisticasSet;