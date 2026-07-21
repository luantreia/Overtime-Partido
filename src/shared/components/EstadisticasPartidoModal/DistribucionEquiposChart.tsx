import type { FC } from 'react';
import {
  ResponsiveContainer, Cell, PieChart, Pie, Tooltip
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

type EquipoDato = {
  _id?: string;
  nombre?: string;
  throws?: number;
};

type DistribucionEquiposChartProps = {
  estadisticas: {
    equipos?: EquipoDato[];
  };
  modoEstadisticasUI: 'automatico' | 'manual';
};

export const DistribucionEquiposChart: FC<DistribucionEquiposChartProps> = ({ estadisticas, modoEstadisticasUI }) => {
  // Usar las estadísticas de equipos calculadas desde el backend
  const equiposData = estadisticas.equipos || [];
  console.log('📊 Estructura del primer equipo:', equiposData[0] || 'Sin equipos');

  // Si no hay equipos, mostrar mensaje
  if (equiposData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center mb-4">
          <h4 className="text-lg font-semibold">
            Distribución de Lanzamientos por Equipo
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

  // Datos para el gráfico de torta (distribución por equipo)
  const pieData = equiposData.map((equipo, index) => ({
    name: equipo.nombre ?? 'Equipo',
    value: equipo.throws ?? 0,
    fill: COLORS[index % COLORS.length]
  }));

  console.log('🍰 Datos para gráfico de torta:', pieData);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="text-center mb-4">
        <h4 className="text-lg font-semibold">
          Distribución de Lanzamientos por Equipo
          <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            modoEstadisticasUI === 'automatico'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {modoEstadisticasUI === 'automatico' ? '📊 Auto' : '✏️ Manual'}
          </span>
        </h4>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? 'Equipo'} (${((percent ?? 0) * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};