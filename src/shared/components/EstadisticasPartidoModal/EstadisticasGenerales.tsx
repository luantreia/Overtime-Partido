import type { ReactNode } from 'react';
import type {
  ModoEstadisticas,
  EstadisticasGeneralesData,
} from './types';
import { MensajeSinDatos } from './MensajeSinDatos';
import { EstadisticasGeneralesHeader } from './EstadisticasGeneralesHeader';
import { EstadisticasCards } from './EstadisticasCards';
import { DistribucionEquiposChart } from './DistribucionEquiposChart';
import { ComparativaEquiposTable } from './ComparativaEquiposTable';

export const renderEstadisticasGenerales = (
  estadisticas: EstadisticasGeneralesData,
  _partido: unknown,
  modoEstadisticasUI: ModoEstadisticas = 'automatico',
  modoVisualizacionUI: ModoEstadisticas = 'automatico',
): ReactNode => {
  void modoVisualizacionUI;

  if (estadisticas.mensaje && estadisticas.tipo === 'sin-datos-manuales') {
    return <MensajeSinDatos estadisticas={estadisticas} />;
  }

  return (
    <div className="space-y-8">
      <EstadisticasGeneralesHeader modoEstadisticasUI={modoEstadisticasUI} />

      <EstadisticasCards estadisticas={estadisticas} />

      <DistribucionEquiposChart estadisticas={estadisticas} modoEstadisticasUI={modoEstadisticasUI} />

      <ComparativaEquiposTable estadisticas={estadisticas} modoEstadisticasUI={modoEstadisticasUI} />
    </div>
  );
};