import React from 'react';

interface EstadisticasGeneralesPartidoProps {
  partidoId: string;
  partido?: any;
  onRefresh?: any;
  onCambiarModoEstadisticas?: any;
}

const EstadisticasGeneralesPartido: React.FC<EstadisticasGeneralesPartidoProps> = (props) => {
  return (
    <div className="p-4 text-center text-gray-500">
      Componente de Estadísticas Generales (Placeholder)
      <pre className="text-xs text-left mt-2 overflow-auto max-h-20">
        {JSON.stringify(props, null, 2)}
      </pre>
    </div>
  );
};

export default EstadisticasGeneralesPartido;
