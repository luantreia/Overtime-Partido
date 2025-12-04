import type { KeyboardEvent, ReactNode } from 'react';
import type { Partido } from '../../../types';
import { formatDate, formatDateTime } from '../../../utils/formatDate';

export interface PartidoCardProps {
  partido: Partido;
  variante?: 'proximo' | 'resultado';
  actions?: ReactNode;
  onClick?: () => void;
}

const badgeStyles = {
  programado: {
    label: 'Programado',
    className: 'bg-slate-100 text-slate-600',
  },
  en_juego: {
    label: 'En Juego',
    className: 'bg-amber-100 text-amber-700 animate-pulse',
  },
  finalizado: {
    label: 'Finalizado',
    className: 'bg-emerald-100 text-emerald-600',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-600',
  },
  proximamente: {
    label: 'Próximamente',
    className: 'bg-sky-100 text-sky-700',
  }
} as const;

const PartidoCard = ({ partido, variante = 'proximo', actions, onClick }: PartidoCardProps) => {
  const fechaTexto = partido.fecha && partido.hora
    ? formatDateTime(`${partido.fecha}T${partido.hora}`)
    : partido.fecha
    ? formatDate(partido.fecha)
    : 'Fecha no disponible';

  const estado = partido.estado || 'programado';
  const badge = badgeStyles[estado as keyof typeof badgeStyles] || badgeStyles.programado;
  const mostrarMarcador = estado === 'finalizado' || estado === 'en_juego';

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const renderEscudo = (equipo: any, fallback: string) => {
    if (equipo?.escudo) {
      return <img src={equipo.escudo} alt={equipo.nombre} className="h-12 w-12 object-contain" />;
    }
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-400">
        {equipo?.nombre?.charAt(0) || fallback}
      </div>
    );
  };

  return (
    <article
      className={`flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition overflow-hidden ${
        onClick ? 'cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Header: Competencia + Fecha + Estado */}
      <div className="flex items-center justify-between bg-slate-50/50 px-4 py-2 border-b border-slate-100">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {partido.competencia?.nombre ?? 'Amistoso'}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {fechaTexto}
          </span>
        </div>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Body: Enfrentamiento */}
      <div className="flex items-center justify-between p-4 flex-1">
        {/* Local */}
        <div className="flex flex-col items-center gap-2 w-1/3 text-center">
          {renderEscudo(partido.equipoLocal, 'L')}
          <span className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight">
            {partido.equipoLocal?.nombre || 'Local'}
          </span>
        </div>

        {/* VS / Marcador */}
        <div className="flex flex-col items-center justify-center w-1/3">
          {mostrarMarcador ? (
            <div className="flex items-center gap-3 text-2xl font-bold text-slate-900">
              <span>{partido.marcadorLocal ?? 0}</span>
              <span className="text-slate-300">-</span>
              <span>{partido.marcadorVisitante ?? 0}</span>
            </div>
          ) : (
            <span className="text-xl font-bold text-slate-300">VS</span>
          )}
          {partido.escenario && (
            <span className="mt-1 text-[10px] text-slate-400 text-center line-clamp-1">
              {partido.escenario}
            </span>
          )}
        </div>

        {/* Visitante */}
        <div className="flex flex-col items-center gap-2 w-1/3 text-center">
          {renderEscudo(partido.equipoVisitante, 'V')}
          <span className="text-sm font-semibold text-slate-900 line-clamp-2 leading-tight">
            {partido.equipoVisitante?.nombre || partido.rival || 'Visitante'}
          </span>
        </div>
      </div>

      {/* Footer: Actions */}
      {actions && (
        <div className="border-t border-slate-100 bg-slate-50/30 px-4 py-3 flex justify-center sm:justify-end gap-2">
          {actions}
        </div>
      )}
    </article>
  );
};

export default PartidoCard;