import type { FC, ReactNode } from 'react';

type EquipoResumenEstadistica = {
  throws?: number;
  hits?: number;
  outs?: number;
  catches?: number;
};

type EstadisticasResumen = {
  equipos?: EquipoResumenEstadistica[];
  jugadores?: { _id?: string }[];
};

type EstadisticasCardsProps = {
  estadisticas: EstadisticasResumen;
};

export const EstadisticasCards: FC<EstadisticasCardsProps> = ({ estadisticas }) => {
  // Calcular totales del partido desde estadísticas agregadas de equipos
  // Esto asegura consistencia entre modo automático y manual
  const equiposData = estadisticas.equipos ?? [];
  const totales = equiposData.reduce<Required<EquipoResumenEstadistica>>(
    (acc, equipo) => ({
      throws: acc.throws + (equipo.throws ?? 0),
      hits: acc.hits + (equipo.hits ?? 0),
      outs: acc.outs + (equipo.outs ?? 0),
      catches: acc.catches + (equipo.catches ?? 0),
    }),
    { throws: 0, hits: 0, outs: 0, catches: 0 },
  );

  const efectividadGeneral = totales.throws > 0
    ? ((totales.hits / totales.throws) * 100).toFixed(1)
    : 0;

  console.log('🏆 Datos de equipos para calcular totales:', equiposData);
  console.log('🎨 Renderizando tarjetas de estadísticas con totales calculados de equipos:', {
    totales: totales,
    efectividad: efectividadGeneral,
    equipos: equiposData.length,
    jugadoresTotales: estadisticas.jugadores?.length ?? 0
  });

  return (
    <div className="space-y-8">
      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Lanzamientos"
          value={totales.throws}
          color="bg-blue-100 text-blue-800"
        />
        <StatCard
          title="Total Golpes"
          value={totales.hits}
          color="bg-green-100 text-green-800"
        />
        <StatCard
          title="Total Outs"
          value={totales.outs}
          color="bg-red-100 text-red-800"
        />
        <StatCard
          title="Total Atrapadas"
          value={totales.catches}
          color="bg-yellow-100 text-yellow-800"
        />
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{efectividadGeneral}%</div>
          <div className="text-sm text-gray-600">Efectividad General</div>
          <div className="text-xs text-gray-500 mt-1">(Golpes/Lanzamientos)</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">{equiposData.length}</div>
          <div className="text-sm text-gray-600">Equipos Participantes</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{estadisticas.jugadores?.length ?? 0}</div>
          <div className="text-sm text-gray-600">Jugadores Totales</div>
        </div>
      </div>
    </div>
  );
};

type StatCardProps = {
  title: ReactNode;
  value: ReactNode;
  color: string;
};

function StatCard({ title, value, color }: StatCardProps) {
  return (
    <div className={`p-3 rounded-lg ${color}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}