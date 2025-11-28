import React from 'react';
import { Partido } from '../types/partido';

interface PartidoTableProps {
  partidos: Partido[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (partido: Partido) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  renderActions?: (partido: Partido) => React.ReactNode;
}

export const PartidoTable: React.FC<PartidoTableProps> = ({
  partidos,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  loading = false,
  renderActions,
}) => {
  const getEstadoColor = (est: string) => {
    switch (est) {
      case 'en_curso': return 'bg-yellow-100 text-yellow-800';
      case 'finalizado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-slate-600">Cargando partidos...</div>
      </div>
    );
  }

  if (partidos.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        No hay partidos
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Mobile View (Cards) */}
      <div className="block md:hidden divide-y divide-slate-200">
        {partidos.map((p) => (
          <div key={p._id} className={`p-4 ${selectedIds.has(p._id) ? 'bg-blue-50' : ''}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${getEstadoColor(p.estado || 'programado')}`}>
                  {p.estado?.replace('_', ' ').toUpperCase() || 'PROGRAMADO'}
                </span>
                <span>•</span>
                <span>{new Date(p.fecha || '').toLocaleDateString()}</span>
                {p.hora && (
                  <>
                    <span>•</span>
                    <span>{p.hora}</span>
                  </>
                )}
              </div>
              <input
                type="checkbox"
                checked={selectedIds.has(p._id)}
                onChange={() => onToggleSelect(p._id)}
                className="rounded border-slate-300"
              />
            </div>

            <div className="flex justify-between items-center mb-4">
              {/* Local */}
              <div className="flex flex-col items-center w-1/3 text-center">
                {p.equipoLocal?.escudo ? (
                  <img src={p.equipoLocal.escudo} alt="local" className="w-12 h-12 rounded-full object-cover mb-2 border border-slate-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-400 mb-2">L</div>
                )}
                <span className="text-sm font-bold text-slate-800 leading-tight">{p.equipoLocal?.nombre || 'Local'}</span>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center w-1/3">
                <div className="text-2xl font-bold text-slate-900 tracking-widest">
                  {p.marcadorLocal ?? '-'} : {p.marcadorVisitante ?? '-'}
                </div>
                <div className="text-xs text-slate-500 mt-1 text-center px-2">
                  {p.competencia?.nombre || 'Amistoso'}
                </div>
              </div>

              {/* Visitante */}
              <div className="flex flex-col items-center w-1/3 text-center">
                {p.equipoVisitante?.escudo ? (
                  <img src={p.equipoVisitante.escudo} alt="visitante" className="w-12 h-12 rounded-full object-cover mb-2 border border-slate-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-400 mb-2">V</div>
                )}
                <span className="text-sm font-bold text-slate-800 leading-tight">{p.equipoVisitante?.nombre || 'Visita'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              {renderActions ? renderActions(p) : (
                <>
                  <button onClick={() => onEdit(p)} className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded">Editar</button>
                  <button onClick={() => onDelete(p._id)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded">Eliminar</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-3 py-3 w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.size === partidos.length && partidos.length > 0}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Equipo Local</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-700">Resultado</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Equipo Visitante</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Competencia</th>
              <th className="px-6 py-3 text-left font-semibold text-slate-700">Fecha</th>
              <th className="px-6 py-3 text-center font-semibold text-slate-700">Estado</th>
              <th className="px-6 py-3 text-right font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {partidos.map((p) => (
              <tr key={p._id} className={`hover:bg-slate-50 transition ${selectedIds.has(p._id) ? 'bg-blue-50' : ''}`}>
                <td className="px-3 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p._id)}
                    onChange={() => onToggleSelect(p._id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {p.equipoLocal?.escudo ? (
                      <img 
                        src={p.equipoLocal.escudo} 
                        alt="escudo local" 
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-400">—</div>
                    )}
                    <span className="text-slate-900 font-medium">{p.equipoLocal?.nombre || '—'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="font-bold text-lg text-slate-900">
                    {p.marcadorLocal !== undefined ? p.marcadorLocal : '—'} - {p.marcadorVisitante !== undefined ? p.marcadorVisitante : '—'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {p.equipoVisitante?.escudo ? (
                      <img 
                        src={p.equipoVisitante.escudo} 
                        alt="escudo visitante" 
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-400">—</div>
                    )}
                    <span className="text-slate-900 font-medium">{p.equipoVisitante?.nombre || '—'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {p.competencia?.nombre || 'Amistoso'}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <div className="text-sm">{new Date(p.fecha || '').toLocaleDateString()}</div>
                  {p.hora && <div className="text-xs text-slate-500">{p.hora}</div>}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getEstadoColor(p.estado || 'programado')}`}>
                    {p.estado?.replace('_', ' ').toUpperCase() || 'PROGRAMADO'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {renderActions ? renderActions(p) : (
                      <>
                        <button
                          onClick={() => onEdit(p)}
                          className="rounded px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDelete(p._id)}
                          className="rounded px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
