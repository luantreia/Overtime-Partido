import { useState, type FC } from 'react';
import GraficoEstadisticasSet from '../../../../../features/estadisticas/components/GraficoEstadisticasSet';

interface SetPartidoResumen {
  _id: string;
  numeroSet: number;
  estadoSet: string;
  ganadorSet: string;
}

interface PartidoConSets {
  sets?: SetPartidoResumen[];
}

interface SeccionEstadisticasSetASetProps {
  partido: PartidoConSets;
  onAbrirCaptura?: (numeroSet?: number) => void;
  onAbrirGestionSets?: () => void;
}

export const SeccionEstadisticasSetASet: FC<SeccionEstadisticasSetASetProps> = ({ partido, onAbrirCaptura, onAbrirGestionSets }) => {
  const [setsExpandidos, setSetsExpandidos] = useState<Record<string, boolean>>({});

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h4 className="text-lg font-semibold text-purple-800">🎯 Estadísticas Set a Set</h4>
          <p className="text-sm text-purple-700">Análisis detallado de cada set individual del partido</p>
        </div>

        {onAbrirGestionSets && (
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors self-start sm:self-auto"
            onClick={() => onAbrirGestionSets()}
            title="Gestionar sets"
          >
            <span>Gestionar sets</span>
          </button>
        )}
      </div>
      {partido.sets && partido.sets.length > 0 ? (
        <div className="space-y-3">
          {partido.sets.map(set => {
            const isExpanded = setsExpandidos[set._id];

            return (
              <div key={set._id} className="bg-white rounded border">
                {/* Header del set */}
                <div
                  className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSetsExpandidos(prev => ({
                    ...prev,
                    [set._id]: !prev[set._id]
                  }))}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-lg">Set {set.numeroSet}</span>
                    <span className="text-sm text-gray-600">
                      Estado: <span className="font-medium">{set.estadoSet}</span>
                    </span>
                    <span className="text-sm text-gray-600">
                      Ganador: <span className="font-medium">{set.ganadorSet}</span>
                    </span>
                  </div>
                  {onAbrirCaptura && (
                    <button
                      type="button"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
                      onClick={event => {
                        event.stopPropagation();
                        onAbrirCaptura(set.numeroSet);
                      }}
                    >
                      <span>Capturar estadísticas</span>
                    </button>
                  )}
                </div>

                {/* Estadísticas expandidas */}
                {isExpanded && (
                  <div className="border-t px-3 pb-3 space-y-3">
                    <GraficoEstadisticasSet setId={set._id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-600">No hay sets creados aún. Crea sets para ver estadísticas detalladas.</p>
      )}
    </div>
  );
};
