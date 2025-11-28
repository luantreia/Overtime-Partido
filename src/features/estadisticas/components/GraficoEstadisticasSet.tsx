import React from 'react';

interface GraficoEstadisticasSetProps {
  setId: string;
}

const GraficoEstadisticasSet: React.FC<GraficoEstadisticasSetProps> = ({ setId }) => {
  return (
    <div className="p-4 text-center text-gray-500">
      Gráfico de Estadísticas por Set (Placeholder) - Set ID: {setId}
    </div>
  );
};

export default GraficoEstadisticasSet;
