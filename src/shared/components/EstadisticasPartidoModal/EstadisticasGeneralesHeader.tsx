import type { FC } from 'react';
import type { ModoEstadisticas } from './types';

type EstadisticasGeneralesHeaderProps = {
  modoEstadisticasUI: ModoEstadisticas;
};

export const EstadisticasGeneralesHeader: FC<EstadisticasGeneralesHeaderProps> = ({ modoEstadisticasUI }) => {
  // Determinar el título basado en el modo de estadísticas
  const tituloResumen = modoEstadisticasUI === 'automatico'
    ? 'Resumen General del Partido (Estadísticas Automáticas por Set)'
    : 'Resumen General del Partido (Estadísticas Manuales Totales)';

  return (
    <div className="text-center">
      <h3 className="text-2xl font-bold text-center">{tituloResumen}</h3>
      <div className="mt-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          modoEstadisticasUI === 'automatico'
            ? 'bg-brand-100 text-brand-800 border border-brand-200'
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          {modoEstadisticasUI === 'automatico' ? '📊 Automático (por Set)' : '✏️ Manual (Totales)'}
        </span>
      </div>
    </div>
  );
};