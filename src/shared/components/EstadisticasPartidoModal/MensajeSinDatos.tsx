import type { FC } from 'react';

type MensajeSinDatosProps = {
  estadisticas: {
    mensaje?: string;
    tipo?: string;
  };
};

export const MensajeSinDatos: FC<MensajeSinDatosProps> = ({ estadisticas }) => {
  if (!estadisticas?.mensaje || estadisticas.tipo !== 'sin-datos-manuales') {
    return null;
  }

  console.log('⚠️ Mostrando mensaje de sin datos manuales');

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-center">Estadísticas del Partido</h3>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <div className="text-yellow-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-lg font-semibold text-yellow-800 mb-2">No hay estadísticas manuales</h4>
        <p className="text-yellow-700 mb-4">{estadisticas.mensaje}</p>
        <p className="text-sm text-yellow-600">
          Haz clic en <strong>"⚡ Estadísticas Directas"</strong> para capturar estadísticas manuales.
        </p>
      </div>
    </div>
  );
};