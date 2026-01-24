import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { socket } from '../../services/socket';
import { authFetch } from '../../shared/utils/authFetch';
import { useToast } from '../../shared/components/Toast/ToastProvider';
import OverlayScoreboard from '../overlay/OverlayScoreboard';
import { useDriftFreeTimers } from '../../shared/hooks/useDriftFreeTimers';
import { confirmPeriodChange } from '../../shared/utils/periodHelper';
import { listSets, createSet, finishSetApi, reopenSetApi, deleteSetApi, changeWinnerApi, SetPartidoDTO } from '../../shared/features/partido/services/setService';
import { showOverlay, hideOverlay } from '../../shared/services/overlayService';

type SetPartido = SetPartidoDTO;

// Custom hook for debounced actions (prevents double-clicks)
const useDebounce = (delay = 600) => {
  const lastCallRef = useRef<Map<string, number>>(new Map());
  
  const debounce = useCallback(<T extends (...args: any[]) => Promise<any>>(fn: T, key = 'default') => {
    return async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      const now = Date.now();
      const lastCall = lastCallRef.current.get(key) || 0;
      if (now - lastCall < delay) {
        console.log(`Debounced: ${key} (${now - lastCall}ms since last call)`);
        return undefined;
      }
      lastCallRef.current.set(key, now);
      return await fn(...args);
    };
  }, [delay]);
  
  return { debounce };
};

export const ControlPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const matchId = searchParams.get('matchId');

  const [localScore, setLocalScore] = useState(0);
  const [visitorScore, setVisitorScore] = useState(0);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [matchData, setMatchData] = useState<any>(null);
  const [sets, setSets] = useState<SetPartido[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSetTimerOnOverlay, setShowSetTimerOnOverlay] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debounce hook for preventing double-clicks
  const { debounce } = useDebounce(600);

  const matchDurationMinutes = 20; // duración base por periodo

  const { state: timersState, controllerActions } = useDriftFreeTimers({
    mode: 'controller',
    matchId,
    socket,
    initialMatchTime: matchDurationMinutes * 60,
    initialSetTime: 3 * 60,
    initialPeriod: 1
  });

  const { matchTime, setTimer, suddenDeathTime, period, isMatchRunning, isSetRunning, isSuddenDeathActive, suddenDeathMode } = timersState;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const loadMatchData = useCallback(async () => {
    if (!matchId) return;
    try {
      const data: any = await authFetch(`/partidos/${matchId}`);
      setMatchData(data);
      setLocalScore(data.marcadorLocal || 0);
      setVisitorScore(data.marcadorVisitante || 0);

      // Ranked Match Sync Logic
      const isRanked = !!data.isRanked;
      const meta = data.rankedMeta || {};
      const matchDuration = meta.matchDuration || data.timerMatchValue || 1200; // default 20m
      
      if (isRanked && meta.startTime) {
        const startTs = new Date(meta.startTime).getTime();
        const elapsedSinceStart = Math.floor((Date.now() - startTs) / 1000);
        const restored = Math.max(0, matchDuration - elapsedSinceStart);
        controllerActions?.setMatchTimeManual(restored);
        
        // If match should be running but isn't, we can't force it here without starting the internal server timer.
        // But if the server timer is already running (data.timerMatchRunning), it will sync via socket too.
      } else if (data.timerMatchValue !== undefined) {
        let restored = data.timerMatchValue;
        if (data.timerMatchRunning && data.timerMatchLastUpdate) {
          const elapsed = Math.floor((Date.now() - new Date(data.timerMatchLastUpdate).getTime()) / 1000);
          restored = Math.max(0, restored - elapsed);
        }
        controllerActions?.setMatchTimeManual(restored);
      }
      
      if (data.period && data.period !== period) controllerActions?.changePeriod(data.period);
    } catch (err) {
      console.error(err);
    }
  }, [matchId, controllerActions, period]);

  const loadSets = useCallback(async (restore = false) => {
    if (!matchId) return;
    setIsLoading(true);
    try {
      const data = await listSets(matchId);
      setSets(data);
      let localPts = 0, visitPts = 0;
      data.forEach(s => {
        if (s.estadoSet !== 'finalizado') return;
        if (matchData?.modalidad === 'Cloth') {
          if (s.ganadorSet === 'local') localPts += 2; else if (s.ganadorSet === 'visitante') visitPts += 2; else if (s.ganadorSet === 'empate') { localPts++; visitPts++; }
        } else {
          if (s.ganadorSet === 'local') localPts++; else if (s.ganadorSet === 'visitante') visitPts++;
        }
      });
      setLocalScore(localPts); setVisitorScore(visitPts);
      
      if (restore) {
        // Special logic for Ranked Match sync
        if (matchData?.isRanked && matchData?.rankedMeta?.startTime) {
          const totalFinishedDuration = data.reduce((sum, s) => {
            if (s.estadoSet !== 'finalizado') return sum;
            return sum + (s.duracionReal || (s as any).lastSetDuration || 0);
          }, 0);
          
          const matchStartTs = new Date(matchData.rankedMeta.startTime).getTime();
          const totalElapsed = Math.floor((Date.now() - matchStartTs) / 1000);
          const currentSetElapsed = Math.max(0, totalElapsed - totalFinishedDuration);
          const setLimit = matchData.rankedMeta.setDuration || 180;

          if (currentSetElapsed >= setLimit) {
            controllerActions?.setSetTimeManual(0);
            controllerActions?.setSuddenDeathMode(true);
            controllerActions?.startSuddenDeath();
            // In sudden death, we might want to sync the SD elapsed time too
            // TODO: adjustSDManual(currentSetElapsed - setLimit) if hook supports it
          } else {
            controllerActions?.setSetTimeManual(setLimit - currentSetElapsed);
            if (matchData.timerMatchRunning) controllerActions?.startSetIfNeeded();
          }
        } else {
          // Standard restoration logic
          const current = data.find(s => s.estadoSet === 'en_juego');
          if (current) {
            let restoredSet = current.timerSetValue || 0;
            if (current.timerSetRunning && current.timerSetLastUpdate) {
              const elapsed = Math.floor((Date.now() - new Date(current.timerSetLastUpdate).getTime()) / 1000);
              restoredSet = Math.max(0, restoredSet - elapsed);
            }
            controllerActions?.setSetTimeManual(restoredSet);
            if (current.timerSetRunning) controllerActions?.startSetIfNeeded();
            // ... SD logic ...
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, matchData, controllerActions]);

  useEffect(() => { if (!matchId) navigate('/config'); }, [matchId, navigate]);
  
  useEffect(() => {
    const initialize = async () => {
      if (!matchId) return;
      setIsLoading(true);
      try {
        await loadMatchData();
        await loadSets(true);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [matchId, loadMatchData, loadSets]);

  useEffect(() => {
    if (!matchId) return;
    const onConnect = () => { setIsConnected(true); socket.emit('join_match', matchId); };
    const onDisconnect = () => setIsConnected(false);
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    if (socket.connected) onConnect(); else socket.connect();
    
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [matchId]);

  // Persist timers state to backend without emitting (hook emission handles broadcast)
  // REMOVED: Server is now authoritative and persists state automatically.
  /* const saveTimerState = ... */


  const updateGlobalScore = async (newLocal: number, newVisitor: number) => {
    if (!matchId) return;
    setLocalScore(newLocal); setVisitorScore(newVisitor);
    socket.emit('score:update', { matchId, localScore: newLocal, visitorScore: newVisitor });
    try { await authFetch(`/partidos/${matchId}`, { method: 'PUT', body: { marcadorLocal: newLocal, marcadorVisitante: newVisitor } }); } catch (e) { console.error('Error guardando marcador', e); }
  };

  const startNewSetInternal = async (autoStart = false) => {
    if (!matchId) return;
    const nextSetNumber = sets.length + 1;
    setIsSaving(true);
    try {
      await createSet(matchId, nextSetNumber);
      addToast({ type: 'success', message: `Set ${nextSetNumber} iniciado` });
      await loadSets(false);
      // Timer is automatically reset to default (3:00) by backend when creating new set
      // Only pause set timer, not match timer
      controllerActions?.pauseSetOnly();
      if (autoStart) {
        if (matchData?.modalidad === 'Foam' && !suddenDeathMode) {
          // No save needed
        } else {
          controllerActions?.startSetIfNeeded();
        }
      } else {
        // No save needed
      }
    } catch { addToast({ type: 'error', message: 'Error al iniciar set' }); } finally { setIsSaving(false); }
  };
  const startNewSet = debounce(startNewSetInternal, 'startNewSet');

  const finishSetInternal = async (setId: string, winner: 'local' | 'visitante' | 'empate') => {
    setIsSaving(true);
    try {
      // Only pause set/sudden death timer, not the match timer
      controllerActions?.pauseSetOnly();
      // saveTimerState removed
      await finishSetApi(setId, winner);
      let title = 'SET FINALIZADO'; let subtitle = '';
      if (winner === 'local') subtitle = `Set para ${matchData.equipoLocal.nombre}`; else if (winner === 'visitante') subtitle = `Set para ${matchData.equipoVisitante.nombre}`; else subtitle = 'Set Empatado';
      showOverlay(socket, matchId, 'SET_WINNER', { title, subtitle });
      let ptsLocal = 0, ptsVisit = 0;
      if (matchData.modalidad === 'Cloth') { if (winner === 'local') ptsLocal = 2; else if (winner === 'visitante') ptsVisit = 2; else { ptsLocal = 1; ptsVisit = 1; } }
      else { if (winner === 'local') ptsLocal = 1; else if (winner === 'visitante') ptsVisit = 1; }
      await updateGlobalScore(localScore + ptsLocal, visitorScore + ptsVisit);
      addToast({ type: 'success', message: `Set finalizado: ${winner}` });
      await loadSets();
    } catch { addToast({ type: 'error', message: 'Error al finalizar set' }); } finally { setIsSaving(false); }
  };
  const finishSet = debounce(finishSetInternal, 'finishSet');

  const deleteSetInternal = async (setId: string) => { if (!window.confirm('¿Eliminar este set?')) return; setIsSaving(true); try { await deleteSetApi(setId); addToast({ type: 'success', message: 'Set eliminado' }); await loadSets(); } catch { addToast({ type: 'error', message: 'Error al eliminar set' }); } finally { setIsSaving(false); } };
  const deleteSet = debounce(deleteSetInternal, 'deleteSet');
  
  const reopenSetInternal = async (setId: string) => { if (!window.confirm('¿Reabrir este set?')) return; setIsSaving(true); try { await reopenSetApi(setId); addToast({ type: 'success', message: 'Set reabierto' }); await loadSets(); } catch { addToast({ type: 'error', message: 'Error al reabrir set' }); } finally { setIsSaving(false); } };
  const reopenSet = debounce(reopenSetInternal, 'reopenSet');
  
  const changeSetWinnerInternal = async (setId: string, newWinner: 'local' | 'visitante' | 'empate') => { setIsSaving(true); try { await changeWinnerApi(setId, newWinner); addToast({ type: 'success', message: 'Ganador actualizado' }); await loadSets(); } catch { addToast({ type: 'error', message: 'Error al actualizar ganador' }); } finally { setIsSaving(false); } };
  const changeSetWinner = debounce(changeSetWinnerInternal, 'changeSetWinner');

  const pauseMatch = (reason: 'TIMEOUT' | 'REVIEW' | 'GENERIC', team?: 'local' | 'visitante') => {
    controllerActions?.pauseAll();
    // saveTimerState removed
    if (reason === 'GENERIC') return;
    const overlayType: 'TIMEOUT' | 'REVIEW' = reason === 'TIMEOUT' ? 'TIMEOUT' : 'REVIEW';
    let subtitle = reason === 'TIMEOUT' ? `Pedido por ${team === 'local' ? matchData.equipoLocal.nombre : matchData.equipoVisitante.nombre}` : 'Juego Detenido';
    showOverlay(socket, matchId, overlayType, { title: overlayType === 'TIMEOUT' ? 'TIEMPO FUERA' : 'REVISIÓN ARBITRAL', subtitle });
  };

  const toggleMatch = async () => {
    if (isMatchRunning) {
      pauseMatch('GENERIC');
    } else {
      controllerActions?.startOrResume();
      hideOverlay(socket, matchId, 'ALL');
      if (sets.length === 0) {
        await startNewSet(true);
      } else {
        const current = sets.find(s => s.estadoSet === 'en_juego');
        if (current) {
          if (matchData?.modalidad === 'Foam' && setTimer === 0 && suddenDeathMode) {
            controllerActions?.startSuddenDeath();
          } else {
            controllerActions?.startSetIfNeeded();
          }
        } else {
          // No active set, just match timer runs
        }
      }
    }
  };

  const resetMatch = async () => {
    if (!matchId) return;
    if (!window.confirm('⚠️ PELIGRO: ¿Reiniciar partido?')) return;
    for (const s of sets) { await authFetch(`/set-partido/${s._id}`, { method: 'DELETE' }); }
    controllerActions?.resetAll();
    setLocalScore(0); setVisitorScore(0); setSets([]);
    try { await authFetch(`/partidos/${matchId}`, { method: 'PUT', body: { marcadorLocal: 0, marcadorVisitante: 0, timerMatchValue: matchDurationMinutes * 60, timerMatchRunning: false, timerMatchLastUpdate: new Date(), period: 1 } }); } catch (e) { console.error('Error reset match', e); }
    socket.emit('score:update', { matchId, localScore: 0, visitorScore: 0 });
    // Manual emit removed; hook will emit updated state on resetAll state change
    addToast({ type: 'success', message: 'Partido Reiniciado' });
  };

  const updateMatchTimeManual = () => { const val = prompt('Tiempo partido (min, ej 15.5):'); if (val && !isNaN(+val)) controllerActions?.setMatchTimeManual(Math.floor(parseFloat(val) * 60)); };
  const updateSetTimeManual = () => { const val = prompt('Tiempo set (min, ej 3):'); if (val && !isNaN(+val)) controllerActions?.setSetTimeManual(Math.floor(parseFloat(val) * 60)); };
  const changePeriod = (newPeriod: number) => { if (!confirmPeriodChange(period, newPeriod)) return; controllerActions?.changePeriod(newPeriod); addToast({ type: 'info', message: `Cambiado a ${newPeriod}º Tiempo` }); };
  
  const toggleOverlaySetTimer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setShowSetTimerOnOverlay(enabled);
    socket.emit('overlay:config', { matchId, showSetTimer: enabled });
  };

  if (!matchData || isLoading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 text-sm">Cargando partido...</span>
      </div>
    </div>
  );
  const currentSet = sets.find(s => s.estadoSet === 'en_juego');

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex justify-between items-center shrink-0 h-12">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/config')} className="text-slate-400 hover:text-slate-600" aria-label="Volver"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg></button>
          <div className="flex items-baseline gap-2"><h1 className="text-sm font-bold text-slate-800">Mesa de Control</h1><p className="text-xs text-slate-500 hidden sm:block">{matchData.equipoLocal?.nombre} vs {matchData.equipoVisitante?.nombre}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded animate-pulse">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Guardando...</span>
            </div>
          )}
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Conectado' : 'Desconectado'} />
        </div>
      </header>
      <main className="flex-1 p-2 overflow-y-auto overflow-x-hidden bg-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 max-w-7xl mx-auto pb-20">
          <div className="md:col-span-7 flex flex-col gap-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 shrink-0">
              <div className="grid grid-cols-5 gap-2 text-[10px] sm:text-xs text-center">
                <div className="bg-slate-50 p-1 rounded"><span className="text-slate-400 block text-[9px] uppercase">Competencia</span><span className="font-semibold text-slate-700 truncate block">{matchData.competencia?.nombre || '-'}</span></div>
                <div className="bg-slate-50 p-1 rounded"><span className="text-slate-400 block text-[9px] uppercase">Fase</span><span className="font-semibold text-slate-700 truncate block">{matchData.fase?.nombre || '-'}</span></div>
                <div className="bg-slate-50 p-1 rounded"><span className="text-slate-400 block text-[9px] uppercase">Modalidad</span><span className="font-semibold text-slate-700 truncate block">{matchData.modalidad}</span></div>
                <div className="bg-slate-50 p-1 rounded"><span className="text-slate-400 block text-[9px] uppercase">Cat</span><span className="font-semibold text-slate-700 truncate block">{matchData.categoria}</span></div>
                <div className="bg-slate-50 p-1 rounded"><span className="text-slate-400 block text-[9px] uppercase">Estado</span><span className={`font-bold ${matchData.estado === 'en_juego' ? 'text-green-600' : 'text-slate-600'}`}>{matchData.estado?.replace('_',' ').toUpperCase()}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 sm:p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sticky top-0 z-20">
              <div className="flex items-center gap-1 order-1">
                <button onClick={() => changePeriod(1)} className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${period === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>1T</button>
                <button onClick={() => changePeriod(2)} className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${period === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>2T</button>
              </div>
              <div className="flex items-center gap-4 sm:gap-6 order-3 sm:order-2 w-full sm:w-auto justify-center sm:justify-end mt-1 sm:mt-0 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                <div className="flex flex-col items-center sm:items-end"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Partido</span><div className="flex items-center gap-2"><span className={`font-mono text-3xl sm:text-4xl font-bold leading-none ${isMatchRunning ? 'text-slate-800' : 'text-slate-400'}`}>{formatTime(matchTime)}</span><button onClick={updateMatchTimeManual} className="text-slate-300 hover:text-slate-500" title="Editar Tiempo"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button></div></div>
                <div className="flex flex-col items-center sm:items-end border-l border-slate-200 pl-4 sm:pl-6"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Set Actual</span><div className="flex items-center gap-2"><span className={`font-mono text-3xl sm:text-4xl font-bold leading-none ${isSuddenDeathActive ? 'text-purple-600 animate-pulse' : (isSetRunning ? 'text-slate-800' : 'text-slate-400')}`}>{isSuddenDeathActive ? `+${formatTime(suddenDeathTime)}` : formatTime(setTimer)}</span>{!isSuddenDeathActive && <button onClick={updateSetTimeManual} className="text-slate-300 hover:text-slate-500" title="Editar Tiempo Set"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>}</div></div>
              </div>
              <button onClick={toggleMatch} className={`order-2 sm:order-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0 ${isMatchRunning ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700' : 'bg-green-500 text-white hover:bg-green-600 hover:scale-105 hover:shadow-green-200'}`} title={isMatchRunning ? 'Pausar' : 'Iniciar / Reanudar'}>{isMatchRunning ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> : <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}</button>
            </div>
            <OverlayScoreboard matchData={matchData} score={{ local: localScore, visitor: visitorScore }} timers={timersState} inline />
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex-1 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => pauseMatch('TIMEOUT','local')} className="bg-orange-100 text-orange-800 text-xs font-bold py-2 rounded hover:bg-orange-200">Time Out Local</button>
                <button onClick={() => pauseMatch('TIMEOUT','visitante')} className="bg-orange-100 text-orange-800 text-xs font-bold py-2 rounded hover:bg-orange-200">Time Out Visita</button>
                <button onClick={() => pauseMatch('REVIEW')} className="col-span-2 bg-purple-100 text-purple-800 text-xs font-bold py-2 rounded hover:bg-purple-200">Revisión Arbitral</button>
              </div>
              <div className="mt-auto pt-2 border-t border-slate-100"><button onClick={resetMatch} className="w-full text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 py-1 rounded transition-colors">⚠️ REINICIAR PARTIDO</button></div>
            </div>
          </div>
          <div className="md:col-span-5 flex flex-col gap-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex flex-col overflow-hidden min-h-[300px]">
              <div className="flex justify-between items-center mb-2 shrink-0">
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider"><span>Historial ({sets.filter(s => s.estadoSet === 'finalizado').length})</span><svg className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg></button>
                {currentSet && <span className="text-[10px] font-bold text-green-600 animate-pulse bg-green-50 px-2 py-0.5 rounded-full">EN JUEGO</span>}
              </div>
              {showHistory && (
                <div className="flex-1 overflow-y-auto space-y-1 mb-2 pr-1 min-h-0 border-b border-slate-100 pb-2">
                  {sets.filter(s => s.estadoSet === 'finalizado').map(s => (
                    <div key={s._id} className="p-2 bg-slate-50 rounded border border-slate-100 text-xs group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-600">Set {s.numeroSet}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => reopenSet(s._id)} className="text-blue-600 hover:bg-blue-100 p-1 rounded" title="Reabrir"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>
                          <button onClick={() => deleteSet(s._id)} className="text-red-600 hover:bg-red-100 p-1 rounded" title="Eliminar"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => changeSetWinner(s._id, 'local')} className={`flex-1 py-1 px-2 rounded text-center border ${s.ganadorSet === 'local' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>{matchData.equipoLocal?.nombre}</button>
                        <button onClick={() => changeSetWinner(s._id, 'visitante')} className={`flex-1 py-1 px-2 rounded text-center border ${s.ganadorSet === 'visitante' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:border-red-300'}`}>{matchData.equipoVisitante?.nombre}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex-1 flex flex-col justify-center bg-slate-50 rounded-lg border border-slate-100 p-2 relative">
                {currentSet ? (
                  <div className="h-full flex flex-col">
                    <div className="text-center mb-2 flex justify-between items-center px-2">
                      <div><h3 className="text-lg font-bold text-slate-800">Set {currentSet.numeroSet}</h3><p className="text-xs text-slate-500">Selecciona el ganador</p></div>
                      <div className="flex flex-col items-end bg-slate-100 p-2 rounded">
                        <label className="flex items-center gap-1 text-[10px] cursor-pointer mb-1" title="Mostrar/Ocultar Timer de Set en Overlay">
                          <input type="checkbox" checked={showSetTimerOnOverlay} onChange={toggleOverlaySetTimer} />
                          <span>Ver en Overlay</span>
                        </label>
                        {matchData.modalidad === 'Foam' && (
                          <label className="flex items-center gap-1 text-[10px] mt-1 cursor-pointer">
                            <input type="checkbox" checked={suddenDeathMode} onChange={e => {
                              const enabled = e.target.checked; controllerActions?.setSuddenDeathMode(enabled); localStorage.setItem(`suddenDeathMode_${matchId}`, String(enabled));
                              if (enabled) {
                                if (isMatchRunning) {
                                  if (setTimer > 0) { controllerActions?.startSetIfNeeded(); }
                                  else { controllerActions?.startSuddenDeath(); }
                                }
                              } else { controllerActions?.pauseAll(); }
                            }} />
                            <span>Muerte Súbita</span>
                          </label>
                        )}
                      </div>
                    </div>
                    <div className={`flex-1 grid ${matchData.modalidad === 'Cloth' ? 'grid-rows-3' : 'grid-rows-2'} gap-2`}>
                      <button onClick={() => finishSet(currentSet._id, 'local')} disabled={isSaving} className={`bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition shadow-sm flex flex-col items-center justify-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}><span>{matchData.equipoLocal?.nombre}</span><span className="text-xs font-normal opacity-75">+{matchData.modalidad === 'Cloth' ? '2' : '1'} Pts</span></button>
                      <button onClick={() => finishSet(currentSet._id, 'visitante')} disabled={isSaving} className={`bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-sm flex flex-col items-center justify-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}><span>{matchData.equipoVisitante?.nombre}</span><span className="text-xs font-normal opacity-75">+{matchData.modalidad === 'Cloth' ? '2' : '1'} Pts</span></button>
                      {matchData.modalidad === 'Cloth' && <button onClick={() => finishSet(currentSet._id, 'empate')} disabled={isSaving} className={`bg-slate-600 text-white rounded-lg font-bold text-lg hover:bg-slate-700 transition shadow-sm flex flex-col items-center justify-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}><span>Empate</span><span className="text-xs font-normal opacity-75">+1 Pt c/u</span></button>}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => startNewSet(false)} disabled={isSaving} className={`w-full h-full bg-green-600 text-white rounded-lg font-bold text-xl hover:bg-green-700 shadow-sm flex flex-col items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664l-3-2z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Iniciar Set {sets.length + 1}</span></button>
                )}
              </div>
              {currentSet && !isSetRunning && !isSuddenDeathActive && isMatchRunning && (
                <div className="mt-2"><button onClick={() => { controllerActions?.startSetIfNeeded(); }} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-md animate-pulse">▶️ INICIAR TIEMPO DE SET</button></div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ControlPage;

