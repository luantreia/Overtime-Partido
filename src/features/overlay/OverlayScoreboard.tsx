import React, { useEffect, useState } from 'react';

interface Timers {
  matchTime: number;
  setTimer: number;
  suddenDeathTime: number;
  period: number;
  isSuddenDeathActive: boolean;
  suddenDeathMode: boolean;
  isMatchRunning?: boolean;
  isSetRunning?: boolean;
}

interface Props {
  matchData: any;
  score: { local: number; visitor: number };
  timers: Timers;
  inline?: boolean; // when true, renders a compact/inline variant suitable for the ControlPage
  showSetTimer?: boolean;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const OverlayScoreboard: React.FC<Props> = ({ matchData, score, timers, inline = false, showSetTimer = true }) => {
  // Local display state so the component can compute times from timestamp+initialValues
  const [display, setDisplay] = useState({
    matchTime: timers.matchTime,
    setTimer: timers.setTimer,
    suddenDeathTime: timers.suddenDeathTime
  });

  useEffect(() => {
    setDisplay({ matchTime: timers.matchTime, setTimer: timers.setTimer, suddenDeathTime: timers.suddenDeathTime });
  }, [timers.matchTime, timers.setTimer, timers.suddenDeathTime]);

  if (!matchData) return null;

  // Use display values for rendering
  const showMatch = display.matchTime;
  const showSet = display.setTimer;
  const showSD = display.suddenDeathTime;

  if (inline) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex items-center gap-4 min-h-[120px] max-h-[40%]">
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-600 truncate">{matchData.equipoLocal?.nombre || 'LOCAL'}</div>
          <div className="text-4xl font-mono font-bold text-blue-600">{score.local}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-bold text-gray-500">Periodo {timers.period}</div>
          <div className="font-mono text-2xl font-bold text-yellow-500">{formatTime(showMatch)}</div>
          {showSetTimer && (
            <div className={`text-xs mt-1 ${timers.isSuddenDeathActive ? 'text-purple-600 font-bold' : 'text-gray-500'}`}>
              {timers.isSuddenDeathActive ? `SD: +${formatTime(showSD)}` : `SET: ${formatTime(showSet)}`}
            </div>
          )}
        </div>
        <div className="flex-1 text-right">
          <div className="text-xs font-bold text-slate-600 truncate">{matchData.equipoVisitante?.nombre || 'VISITA'}</div>
          <div className="text-4xl font-mono font-bold text-red-600">{score.visitor}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-10 left-10 flex items-stretch shadow-2xl rounded-lg overflow-hidden border-2 border-white bg-gray-900">
      {/* Local */}
      <div className="bg-blue-900 text-white px-4 py-2 flex items-center gap-3 min-w-[180px]">
        {matchData.equipoLocal?.escudo && (
           <img src={matchData.equipoLocal.escudo} alt="Local" className="w-10 h-10 object-contain" />
        )}
        <div className="flex flex-col">
           <span className="text-xs font-bold tracking-wider uppercase text-blue-200">LOCAL</span>
           <span className="text-lg font-bold leading-none truncate max-w-[120px]">{matchData.equipoLocal?.nombre || 'LOCAL'}</span>
        </div>
        <span className="text-4xl font-bold ml-auto">{score.local}</span>
      </div>
      
      {/* VS / Time */}
      <div className="bg-black/50 text-white px-4 py-2 flex flex-col items-center justify-center min-w-[100px] border-l border-r border-white/10">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Periodo {timers.period}</span>
        <span className="font-mono text-3xl font-bold text-yellow-400">{formatTime(showMatch)}</span>
        {showSetTimer && (
          <div className={`text-xs font-mono mt-0.5 ${timers.isSuddenDeathActive ? 'text-purple-400 animate-pulse font-bold' : 'text-gray-400'}`}>
              {timers.isSuddenDeathActive ? `SD: +${formatTime(showSD)}` : `SET: ${formatTime(showSet)}`}
          </div>
        )}
      </div>

      {/* Visitor */}
      <div className="bg-red-900 text-white px-4 py-2 flex items-center gap-3 min-w-[180px] flex-row-reverse">
        {matchData.equipoVisitante?.escudo && (
           <img src={matchData.equipoVisitante.escudo} alt="Visita" className="w-10 h-10 object-contain" />
        )}
        <div className="flex flex-col items-end">
           <span className="text-xs font-bold tracking-wider uppercase text-red-200">VISITA</span>
           <span className="text-lg font-bold leading-none truncate max-w-[120px]">{matchData.equipoVisitante?.nombre || 'VISITA'}</span>
        </div>
        <span className="text-4xl font-bold mr-auto">{score.visitor}</span>
      </div>
    </div>
  );
};

export default OverlayScoreboard;
