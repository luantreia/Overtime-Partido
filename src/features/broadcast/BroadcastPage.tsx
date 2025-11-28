import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { socket } from '../../services/socket';
import { authFetch } from '../../shared/utils/authFetch';
import OverlayScoreboard from '../overlay/OverlayScoreboard';

export const BroadcastPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const matchId = searchParams.get('matchId');

  const [localScore, setLocalScore] = useState(0);
  const [visitorScore, setVisitorScore] = useState(0);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [matchData, setMatchData] = useState<any>(null);
  
  useEffect(() => {
    if (!matchId) {
      navigate('/config');
      return;
    }

    loadMatchData();

    function onConnect() {
      setIsConnected(true);
      socket.emit('join_match', matchId);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onScoreUpdate(data: any) {
        if (data.matchId === matchId) {
            setLocalScore(data.localScore);
            setVisitorScore(data.visitorScore);
        }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('score:update', onScoreUpdate);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('score:update', onScoreUpdate);
    };
  }, [matchId, navigate]);

  const loadMatchData = () => {
    authFetch(`/partidos/${matchId}`).then((data: any) => {
      setMatchData(data);
      setLocalScore(data.marcadorLocal || 0);
      setVisitorScore(data.marcadorVisitante || 0);
    }).catch(console.error);
  };

  const triggerOverlay = (type: string, action: 'SHOW' | 'HIDE') => {
    socket.emit('overlay:trigger', {
      matchId,
      type,
      action,
      payload: { message: 'GOLAZO!' }
    });
  };

  if (!matchData) return <div className="p-8 text-center">Cargando partido...</div>;

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex justify-between items-center shrink-0 h-12">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/config')} className="text-slate-400 hover:text-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-bold text-slate-200">Broadcast Control</h1>
            <p className="text-xs text-slate-500 hidden sm:block">{matchData.equipoLocal?.nombre} vs {matchData.equipoVisitante?.nombre}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Conectado' : 'Desconectado'} />
        </div>
      </header>

      <main className="flex-1 p-4 overflow-hidden flex flex-col gap-4">
        
        {/* Top Section: Scoreboard & Info (Read Only) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            {/* Reusable Scoreboard */}
            <div className="md:col-span-2">
              <OverlayScoreboard
                matchData={matchData}
                score={{ local: localScore, visitor: visitorScore }}
                timers={{
                  matchTime: 0,
                  setTimer: 0,
                  suddenDeathTime: 0,
                  period: 1,
                  isSuddenDeathActive: false,
                  suddenDeathMode: false,
                  isMatchRunning: false,
                  isSetRunning: false
                }}
                inline
              />
            </div>

            {/* Info */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-xs space-y-2">
                <div className="flex justify-between">
                    <span className="text-slate-500">Modalidad</span>
                    <span className="font-bold">{matchData.modalidad}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Categoría</span>
                    <span className="font-bold">{matchData.categoria}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Estado</span>
                    <span className={`font-bold ${matchData.estado === 'en_juego' ? 'text-green-500' : 'text-slate-500'}`}>
                        {matchData.estado?.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
            </div>
        </div>

        {/* Middle Section: Overlay Preview & Controls */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
            
            {/* Overlay Controls */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col gap-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Overlay Controls</h2>
                
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => triggerOverlay('GOAL', 'SHOW')} className="bg-green-900/50 text-green-400 border border-green-900/50 hover:bg-green-900 hover:border-green-500 rounded p-3 font-bold transition">
                        GOL
                    </button>
                    <button onClick={() => triggerOverlay('LOWER_THIRD', 'SHOW')} className="bg-purple-900/50 text-purple-400 border border-purple-900/50 hover:bg-purple-900 hover:border-purple-500 rounded p-3 font-bold transition">
                        INFO
                    </button>
                    <button onClick={() => triggerOverlay('AD', 'SHOW')} className="bg-yellow-900/50 text-yellow-400 border border-yellow-900/50 hover:bg-yellow-900 hover:border-yellow-500 rounded p-3 font-bold transition">
                        AD
                    </button>
                    <button onClick={() => triggerOverlay('ALL', 'HIDE')} className="bg-red-900/50 text-red-400 border border-red-900/50 hover:bg-red-900 hover:border-red-500 rounded p-3 font-bold transition">
                        CLEAR ALL
                    </button>
                </div>
            </div>

            {/* Overlay Preview (Iframe) */}
            <div className="md:col-span-2 bg-black rounded-lg border border-slate-700 overflow-hidden relative flex flex-col">
                <div className="bg-slate-900 px-2 py-1 text-[10px] text-slate-500 flex justify-between items-center border-b border-slate-800">
                    <span>LIVE PREVIEW</span>
                    <a href={`/overlay?matchId=${matchId}`} target="_blank" rel="noreferrer" className="hover:text-blue-400">Open in New Tab ↗</a>
                </div>
                <div className="flex-1 relative">
                    <iframe 
                        src={`/overlay?matchId=${matchId}`} 
                        className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                        title="Overlay Preview"
                        style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: '133.33%', height: '133.33%' }}
                    />
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};
