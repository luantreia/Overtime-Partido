import type { ReactNode } from 'react';
import type { EstadisticasJugadoresData } from './types';

export const renderEstadisticasJugadores = (
  estadisticas: EstadisticasJugadoresData,
  _partido: unknown,
): ReactNode => {
  console.log('🎾 renderEstadisticasJugadores recibió:', {
    jugadoresLength: estadisticas.jugadores?.length || 0,
    tieneJugadores: !!estadisticas.jugadores,
    primerJugador: estadisticas.jugadores?.[0] || 'Sin jugadores'
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Estadísticas por Jugador</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Equipo</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lanz.</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Golpes</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Outs</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Atrap.</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Efect.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {estadisticas.jugadores?.length ? estadisticas.jugadores.map((jugador) => {
              const throws = jugador.throws ?? 0;
              const hits = jugador.hits ?? 0;
              const outs = jugador.outs ?? 0;
              const catches = jugador.catches ?? 0;
              const efectividadValor = throws > 0 ? (hits / throws) * 100 : 0;
              const efectividadTexto = efectividadValor.toFixed(1);

              const jugadorInfo = typeof jugador.jugadorPartido === 'object' ? jugador.jugadorPartido?.jugador : undefined;
              const equipoInfo = typeof jugador.jugadorPartido === 'object' ? jugador.jugadorPartido?.equipo : undefined;
              const equipoNombre = typeof equipoInfo === 'string' ? equipoInfo : equipoInfo?.nombre;

              return (
                <tr key={jugador._id ?? `${jugador.jugadorPartido ?? ''}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {jugadorInfo?.nombre ?? 'Sin nombre'} {jugadorInfo?.apellido ?? ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {equipoNombre ?? 'Sin equipo'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {throws}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {hits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {outs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    {catches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${efectividadValor > 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {efectividadTexto}%
                    </span>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No hay estadísticas de jugadores disponibles aún
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};