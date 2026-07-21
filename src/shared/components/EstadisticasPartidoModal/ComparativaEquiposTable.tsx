import type { FC } from 'react';

type EquipoComparativa = {
  _id?: string;
  nombre?: string;
  escudo?: string;
  throws?: number;
  hits?: number;
  efectividad?: number;
  jugadores?: number;
};

type ComparativaEquiposTableProps = {
  estadisticas: {
    equipos?: EquipoComparativa[];
  };
  modoEstadisticasUI: 'automatico' | 'manual';
};

export const ComparativaEquiposTable: FC<ComparativaEquiposTableProps> = ({ estadisticas, modoEstadisticasUI }) => {
  // Usar las estadísticas de equipos calculadas desde el backend
  const equiposData = estadisticas?.equipos ?? [];
  console.log('🏆 Datos de equipos para tabla:', equiposData);

  // Si no hay equipos, mostrar mensaje
  if (equiposData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center mb-4">
          <h4 className="text-lg font-semibold">
            Comparativa Rápida por Equipo
            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              modoEstadisticasUI === 'automatico'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {modoEstadisticasUI === 'automatico' ? '📊 Auto' : '✏️ Manual'}
            </span>
          </h4>
        </div>
        <div className="text-center text-gray-500 py-8">
          <p>No hay datos de equipos para mostrar en este modo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="text-center mb-4">
        <h4 className="text-lg font-semibold">
          Comparativa Rápida por Equipo
          <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            modoEstadisticasUI === 'automatico'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {modoEstadisticasUI === 'automatico' ? '📊 Auto' : '✏️ Manual'}
          </span>
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Equipo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Lanzamientos
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Golpes
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Efectividad
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Jugadores
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {equiposData.map((equipo) => (
              <tr
                key={equipo._id ?? equipo.nombre ?? Math.random()}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {equipo.escudo && (
                      <img
                        src={equipo.escudo}
                        alt={`Escudo ${equipo.nombre ?? 'Equipo'}`}
                        className="w-8 h-8 object-contain mr-3"
                      />
                    )}
                    <div className="text-sm font-medium text-gray-900">
                      {equipo.nombre ?? 'Equipo'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {equipo.throws ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {equipo.hits ?? 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (equipo.efectividad ?? 0) > 50
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {(equipo.efectividad ?? 0)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  {equipo.jugadores ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};