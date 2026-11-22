import type { ReactNode } from 'react';
import { DataTable } from 'overtime-kit';
import type { EstadisticasJugadoresData } from './types';

type JugadorEstadisticaDetalle = NonNullable<EstadisticasJugadoresData['jugadores']>[number];

const jugadorDe = (j: JugadorEstadisticaDetalle) =>
  typeof j.jugadorPartido === 'object' ? j.jugadorPartido?.jugador : undefined;

const equipoDe = (j: JugadorEstadisticaDetalle) => {
  const equipo = typeof j.jugadorPartido === 'object' ? j.jugadorPartido?.equipo : undefined;
  return typeof equipo === 'string' ? equipo : equipo?.nombre;
};

const efectividad = (j: JugadorEstadisticaDetalle) => {
  const throws = j.throws ?? 0;
  return throws > 0 ? ((j.hits ?? 0) / throws) * 100 : 0;
};

export const renderEstadisticasJugadores = (
  estadisticas: EstadisticasJugadoresData,
  _partido: unknown,
): ReactNode => (
  <div>
    <h3 className="text-xl font-semibold mb-4">Estadísticas por Jugador</h3>
    <DataTable
      caption="Estadísticas por jugador"
      data={estadisticas.jugadores ?? []}
      rowKey={(j) => j._id ?? `${j.jugadorPartido ?? ''}`}
      empty="No hay estadísticas de jugadores disponibles aún"
      pageSize={0}
      mobile="scroll"
      columns={[
        {
          id: 'jugador',
          header: 'Jugador',
          sortValue: (j) => `${jugadorDe(j)?.nombre ?? ''} ${jugadorDe(j)?.apellido ?? ''}`.trim() || null,
          cell: (j) => (
            <span className="whitespace-nowrap font-medium text-gray-900">
              {jugadorDe(j)?.nombre ?? 'Sin nombre'} {jugadorDe(j)?.apellido ?? ''}
            </span>
          ),
        },
        { id: 'equipo', header: 'Equipo', align: 'center', sortValue: (j) => equipoDe(j), cell: (j) => equipoDe(j) ?? 'Sin equipo' },
        { id: 'throws', header: 'Lanz.', align: 'center', sortValue: (j) => j.throws ?? 0, cell: (j) => j.throws ?? 0 },
        { id: 'hits', header: 'Golpes', align: 'center', sortValue: (j) => j.hits ?? 0, cell: (j) => j.hits ?? 0 },
        { id: 'outs', header: 'Outs', align: 'center', sortValue: (j) => j.outs ?? 0, cell: (j) => j.outs ?? 0 },
        { id: 'catches', header: 'Atrap.', align: 'center', sortValue: (j) => j.catches ?? 0, cell: (j) => j.catches ?? 0 },
        {
          id: 'efectividad',
          header: 'Efect.',
          align: 'center',
          sortValue: efectividad,
          cell: (j) => (
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                efectividad(j) > 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {efectividad(j).toFixed(1)}%
            </span>
          ),
        },
      ]}
    />
  </div>
);
