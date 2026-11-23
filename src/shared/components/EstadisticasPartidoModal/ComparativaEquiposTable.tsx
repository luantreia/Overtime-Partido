import type { FC } from 'react';
import { DataTable } from 'overtime-kit';

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
                ? 'bg-brand-100 text-brand-800 border border-brand-200'
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              {modoEstadisticasUI === 'automatico' ? '📊 Auto' : '✏️ Manual'}
            </span>
          </h4>
        </div>
        <div className="text-center text-slate-500 py-8">
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
              ? 'bg-brand-100 text-brand-800 border border-brand-200'
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {modoEstadisticasUI === 'automatico' ? '📊 Auto' : '✏️ Manual'}
          </span>
        </h4>
      </div>
      <DataTable
        caption="Comparativa por equipo"
        data={equiposData}
        rowKey={(equipo) => equipo._id ?? equipo.nombre ?? ''}
        empty="No hay datos de equipos para mostrar en este modo."
        pageSize={0}
        mobile="scroll"
        columns={[
          {
            id: 'equipo',
            header: 'Equipo',
            sortValue: (equipo) => equipo.nombre,
            cell: (equipo) => (
              <div className="flex items-center whitespace-nowrap">
                {equipo.escudo && <img src={equipo.escudo} alt="" className="w-8 h-8 object-contain mr-3" />}
                <span className="font-medium text-slate-900">{equipo.nombre ?? 'Equipo'}</span>
              </div>
            ),
          },
          { id: 'throws', header: 'Lanzamientos', align: 'center', sortValue: (equipo) => equipo.throws ?? 0, cell: (equipo) => equipo.throws ?? 0 },
          { id: 'hits', header: 'Golpes', align: 'center', sortValue: (equipo) => equipo.hits ?? 0, cell: (equipo) => equipo.hits ?? 0 },
          {
            id: 'efectividad',
            header: 'Efectividad',
            align: 'center',
            sortValue: (equipo) => equipo.efectividad ?? 0,
            cell: (equipo) => (
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  (equipo.efectividad ?? 0) > 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {equipo.efectividad ?? 0}%
              </span>
            ),
          },
          { id: 'jugadores', header: 'Jugadores', align: 'center', sortValue: (equipo) => equipo.jugadores ?? 0, cell: (equipo) => equipo.jugadores ?? 0 },
        ]}
      />
    </div>
  );
};