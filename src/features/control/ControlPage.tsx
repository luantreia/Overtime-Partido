import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { socket } from '../../services/socket';
import { authFetch } from '../../shared/utils/authFetch';
import { useToast } from '../../shared/components/Toast/ToastProvider';
import OverlayScoreboard from '../overlay/OverlayScoreboard';
import { useDriftFreeTimers } from '../../shared/hooks/useDriftFreeTimers';
import ConfirmModal from '../../shared/components/ConfirmModal/ConfirmModal';
import ModalBase from '../../shared/components/ModalBase/ModalBase';
import { listSets, createSet, finishSetApi, reopenSetApi, deleteSetApi, changeWinnerApi, SetPartidoDTO } from '../../shared/features/partido/services/setService';
import { showOverlay, hideOverlay } from '../../shared/services/overlayService';

type SetPartido = SetPartidoDTO;

// Custom hook for debounced actions (prevents double-clicks)
const useDebounce = (delay = 1000) => {
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
  const [confirmAction, setConfirmAction] = useState<
    | { type: 'deleteSet'; setId: string }
    | { type: 'reopenSet'; setId: string }
    | { type: 'resetMatch' }
    | { type: 'finalizeMatch' }
    | { type: 'changePeriod'; newPeriod: number }
    | null
  >(null);
  const [timeEditModal, setTimeEditModal] = useState<{ kind: 'match' | 'set'; value: string } | null>(null);

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

  // Refs to avoid infinite dependency loops in callbacks
  const matchDataRef = useRef<any>(null);
  useEffect(() => { matchDataRef.current = matchData; }, [matchData]);
  
  const periodRef = useRef(period);
  useEffect(() => { periodRef.current = period; }, [period]);

  const hasInitialized = useRef(false);

  // Debounce hook for preventing double-clicks
  const { debounce } = useDebounce(600);

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
      } else if (data.timerMatchValue !== undefined) {
        let restored = data.timerMatchValue;
        if (data.timerMatchRunning && data.timerMatchLastUpdate) {
          const elapsed = Math.floor((Date.now() - new Date(data.timerMatchLastUpdate).getTime()) / 1000);
          restored = Math.max(0, restored - elapsed);
        }
        controllerActions?.setMatchTimeManual(restored);
      }
      
      if (data.period && data.period !== periodRef.current) controllerActions?.changePeriod(data.period);
    } catch (err) {
      console.error(err);
    }
  }, [matchId, controllerActions]);

  const loadSets = useCallback(async (restore = false) => {
    if (!matchId) return;
    setIsLoading(true);
    try {
      const data = await listSets(matchId);
      setSets(data);
      let localPts = 0, visitPts = 0;
      data.forEach(s => {
        if (s.estadoSet !== 'finalizado') return;
        if (matchDataRef.current?.modalidad === 'Cloth') {
          if (s.ganadorSet === 'local') localPts += 2; else if (s.ganadorSet === 'visitante') visitPts += 2; else if (s.ganadorSet === 'empate') { localPts++; visitPts++; }
        } else {
          if (s.ganadorSet === 'local') localPts++; else if (s.ganadorSet === 'visitante') visitPts++;
        }
      });
      setLocalScore(localPts); setVisitorScore(visitPts);
      
      if (restore) {
        // Special logic for Ranked Match sync
        const currentMatchData = matchDataRef.current;
        if (currentMatchData?.isRanked && currentMatchData?.rankedMeta?.startTime) {
          const totalFinishedDuration = data.reduce((sum, s) => {
            if (s.estadoSet !== 'finalizado') return sum;
            return sum + (s.duracionReal || (s as any).lastSetDuration || 0);
          }, 0);
          
          const matchStartTs = new Date(currentMatchData.rankedMeta.startTime).getTime();
          const totalElapsed = Math.floor((Date.now() - matchStartTs) / 1000);
          const currentSetElapsed = Math.max(0, totalElapsed - totalFinishedDuration);
          const setLimit = currentMatchData.rankedMeta.setDuration || 180;

          if (currentSetElapsed >= setLimit) {
            controllerActions?.setSetTimeManual(0);
            controllerActions?.setSuddenDeathMode(true);
            controllerActions?.startSuddenDeath();
          } else {
            controllerActions?.setSetTimeManual(setLimit - currentSetElapsed);
            if (currentMatchData.timerMatchRunning) controllerActions?.startSetIfNeeded();
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
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, controllerActions]);

  useEffect(() => { if (!matchId) navigate('/config'); }, [matchId, navigate]);
  
  useEffect(() => {
    const initialize = async () => {
      if (!matchId || hasInitialized.current) return;
      hasInitialized.current = true;
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


  const startNewSetInternal = async (autoStart = false) => {
    if (!matchId || isSaving) return;
    const nextSetNumber = sets.length + 1;
    setIsSaving(true);
    try {
      const created = await createSet(matchId, nextSetNumber);
      addToast({ type: 'success', message: `Set ${nextSetNumber} iniciado` });
      
      // Optimistic update to make it feel faster
      setSets(prev => [...prev, created]);
      
      // Timer is automatically reset to default (3:00) by backend when creating new set
      // Only pause set timer, not match timer
      controllerActions?.pauseSetOnly();
      
      if (autoStart) {
        if (matchData?.modalidad === 'Foam' && !suddenDeathMode) {
          // No action needed
        } else {
          controllerActions?.startSetIfNeeded();
        }
      }
    } catch (err: any) { 
      console.error('Error starting new set:', err);
      // If it's a duplicate set error, just reload the list to recover
      if (err.message?.includes('Ya existe') || err.message?.includes('duplicate')) {
         await loadSets(false);
      } else {
         addToast({ type: 'error', message: 'Error al iniciar set' }); 
      }
    } finally { 
      setIsSaving(false); 
      // Background sync to ensure everything is correct
      loadSets(false).catch(() => {});
    }
  };
  const startNewSet = debounce(startNewSetInternal, 'startNewSet');

  const finishSetInternal = async (setId: string, winner: 'local' | 'visitante' | 'empate') => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // 1. Pause set/sudden death timer immediately
      controllerActions?.pauseSetOnly();

      // 2. Calculate points and update UI immediately (Optimistic Score)
      let ptsLocal = 0, ptsVisit = 0;
      if (matchData.modalidad === 'Cloth') { 
        if (winner === 'local') ptsLocal = 2; else if (winner === 'visitante') ptsVisit = 2; else { ptsLocal = 1; ptsVisit = 1; } 
      } else { 
        if (winner === 'local') ptsLocal = 1; else if (winner === 'visitante') ptsVisit = 1; 
      }
      
      const newScoreLocal = localScore + ptsLocal;
      const newScoreVisitor = visitorScore + ptsVisit;

      // Update local state and emit to socket immediately
      setLocalScore(newScoreLocal);
      setVisitorScore(newScoreVisitor);
      socket.emit('score:update', { matchId, localScore: newScoreLocal, visitorScore: newScoreVisitor });

      // 3. Fire API calls in parallel or sequence
      await finishSetApi(setId, winner);
      
      let title = 'SET FINALIZADO'; 
      let subtitle = '';
      if (winner === 'local') subtitle = `Set para ${matchData.equipoLocal.nombre}`; 
      else if (winner === 'visitante') subtitle = `Set para ${matchData.equipoVisitante.nombre}`; 
      else subtitle = 'Set Empatado';
      
      showOverlay(socket, matchId, 'SET_WINNER', { title, subtitle });
      
      // Update match record in background
      authFetch(`/partidos/${matchId}`, { 
        method: 'PUT', 
        body: { marcadorLocal: newScoreLocal, marcadorVisitante: newScoreVisitor } 
      }).catch(e => console.error('Error guardando marcador', e));

      addToast({ type: 'success', message: `Set finalizado: ${winner}` });
      
      // 4. Reload sets to ensure sync
      await loadSets();
    } catch (err) { 
      console.error('Error finishing set:', err);
      addToast({ type: 'error', message: 'Error al finalizar set' }); 
      // Rollback on error? (Optional)
    } finally { 
      setIsSaving(false); 
    }
  };
  const finishSet = debounce(finishSetInternal, 'finishSet');

  const deleteSetInternal = async (setId: string) => { setIsSaving(true); try { await deleteSetApi(setId); addToast({ type: 'success', message: 'Set eliminado' }); await loadSets(); } catch { addToast({ type: 'error', message: 'Error al eliminar set' }); } finally { setIsSaving(false); } };
  const deleteSet = (setId: string) => setConfirmAction({ type: 'deleteSet', setId });

  const reopenSetInternal = async (setId: string) => { setIsSaving(true); try { await reopenSetApi(setId); addToast({ type: 'success', message: 'Set reabierto' }); await loadSets(); } catch { addToast({ type: 'error', message: 'Error al reabrir set' }); } finally { setIsSaving(false); } };
  const reopenSet = (setId: string) => setConfirmAction({ type: 'reopenSet', setId });
  
  const changeSetWinnerInternal = async (setId: string, newWinner: 'local' | 'visitante' | 'empate') => { setIsSaving(true); try { await changeWinnerApi(setId, newWinner); addToast({ type: 'success', message: 'Ganador actualizado' }); await loadSets(); } catch { addToast({ type: 'error', message: 'Error al actualizar ganador' }); } finally { setIsSaving(false); } };
  const changeSetWinner = debounce(changeSetWinnerInternal, 'changeSetWinner');

  const pauseMatch = (reason: 'TIMEOUT' | 'REVIEW' | 'GENERIC', team?: 'local' | 'visitante') => {
    controllerActions?.pauseAll();
    // saveTimerState removed
    if (reason === 'GENERIC') return;
    const overlayType: 'TIMEOUT' | 'REVIEW' = reason === 'TIMEOUT' ? 'TIMEOUT' : 'REVIEW';
    let subtitle = reason === 'TIMEOUT' ? `Pedido por ${team === 'local' ? matchData.equipoLocal.nombre : matchData.equipoVisitante.nombre}` : 'Juego Detenido';
    showOverlay(socket, matchId, overlayType, { title: overlayType === 'TIMEOUT' ? 'TIEMPO FUERA' : 'REVISIÓN ARBITRAL', subtitle });
    addToast({ type: 'success', message: overlayType === 'TIMEOUT' ? 'Time out enviado al overlay' : 'Revisión enviada al overlay' });
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

  const resetMatch = () => {
    if (!matchId) return;
    setConfirmAction({ type: 'resetMatch' });
  };

  const resetMatchInternal = async () => {
    if (!matchId) return;
    for (const s of sets) { await authFetch(`/set-partido/${s._id}`, { method: 'DELETE' }); }
    controllerActions?.resetAll();
    setLocalScore(0); setVisitorScore(0); setSets([]);
    try { await authFetch(`/partidos/${matchId}`, { method: 'PUT', body: { marcadorLocal: 0, marcadorVisitante: 0, timerMatchValue: matchDurationMinutes * 60, timerMatchRunning: false, timerMatchLastUpdate: new Date(), period: 1 } }); } catch (e) { console.error('Error reset match', e); }
    socket.emit('score:update', { matchId, localScore: 0, visitorScore: 0 });
    // Manual emit removed; hook will emit updated state on resetAll state change
    addToast({ type: 'success', message: 'Partido Reiniciado' });
  };

  const finalizeMatch = () => {
    if (!matchId || !matchData) return;
    setConfirmAction({ type: 'finalizeMatch' });
  };

  const finalizeMatchInternal = async () => {
    if (!matchId || !matchData) return;
    setIsSaving(true);
    try {
      // 1. Stop all timers
      controllerActions?.pauseAll();

      if (matchData.isRanked) {
        // 2. Prepare sets data for ranking
        const mappedSets = sets.map(s => ({
          _id: s._id,
          winner: s.ganadorSet,
          time: s.lastSetDuration || 0
        }));

        // 3. Call the ranked finalize endpoint (applies rating deltas)
        const res: any = await authFetch(`/ranked/match/${matchId}/finalize`, {
          method: 'POST',
          body: {
            marcadorLocal: localScore,
            marcadorVisitante: visitorScore,
            sets: mappedSets,
            creadoPor: 'mesa-de-control',
            startTime: matchData.rankedMeta?.startTime || Date.now()
          }
        });

        if (!res.ok) {
          throw new Error(res.message || 'Error al finalizar');
        }
      } else {
        // Partido no ranked: el endpoint /ranked/match/:id/finalize rechaza
        // partidos con isRanked=false, así que cerramos por la vía estándar.
        await authFetch(`/partidos/${matchId}`, {
          method: 'PUT',
          body: {
            estado: 'finalizado',
            marcadorLocal: localScore,
            marcadorVisitante: visitorScore,
            marcadorModificadoManualmente: true
          }
        });
      }

      addToast({ type: 'success', message: 'Partido finalizado con éxito' });
      // Hide overlay and navigate
      hideOverlay(socket, matchId, 'ALL');
      navigate('/');
    } catch (e: any) {
      console.error('Error finalizando:', e);
      addToast({ type: 'error', message: e.message || 'Error al finalizar partido' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateMatchTimeManual = () => setTimeEditModal({ kind: 'match', value: '' });
  const updateSetTimeManual = () => setTimeEditModal({ kind: 'set', value: '' });

  const handleConfirmTimeEdit = () => {
    if (!timeEditModal) return;
    const val = timeEditModal.value;
    if (val && !isNaN(+val)) {
      const seconds = Math.floor(parseFloat(val) * 60);
      if (timeEditModal.kind === 'match') controllerActions?.setMatchTimeManual(seconds);
      else controllerActions?.setSetTimeManual(seconds);
    }
    setTimeEditModal(null);
  };

  const changePeriod = (newPeriod: number) => {
    if (period === newPeriod) return;
    setConfirmAction({ type: 'changePeriod', newPeriod });
  };

  const executeConfirmedAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (!action) return;
    switch (action.type) {
      case 'deleteSet':
        await debounce(deleteSetInternal, 'deleteSet')(action.setId);
        break;
      case 'reopenSet':
        await debounce(reopenSetInternal, 'reopenSet')(action.setId);
        break;
      case 'resetMatch':
        await resetMatchInternal();
        break;
      case 'finalizeMatch':
        await finalizeMatchInternal();
        break;
      case 'changePeriod':
        controllerActions?.changePeriod(action.newPeriod);
        addToast({ type: 'info', message: `Cambiado a ${action.newPeriod}º Tiempo` });
        break;
      default:
        break;
    }
  };

  const CONFIRM_ACTION_COPY: Record<string, { title: string; message: string; confirmLabel: string; variant: 'danger' | 'primary' | 'default' }> = {
    deleteSet: { title: 'Eliminar set', message: '¿Eliminar este set? Esta acción no se puede deshacer.', confirmLabel: 'Eliminar', variant: 'danger' },
    reopenSet: { title: 'Reabrir set', message: '¿Reabrir este set?', confirmLabel: 'Reabrir', variant: 'primary' },
    resetMatch: { title: 'Reiniciar partido', message: '⚠️ PELIGRO: se van a borrar todos los sets y el marcador de este partido. ¿Reiniciar partido?', confirmLabel: 'Reiniciar', variant: 'danger' },
    finalizeMatch: { title: 'Finalizar partido', message: '¿Finalizar el partido y subir resultados permanentes?', confirmLabel: 'Finalizar', variant: 'primary' },
    changePeriod: { title: 'Cambiar de tiempo', message: `¿Cambiar de tiempo? Esto reiniciará el reloj del partido.`, confirmLabel: 'Cambiar', variant: 'primary' },
  };

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
      <header className="bg-white border-b border-slate-200 px-2 sm:px-4 py-2 flex items-center gap-2 shrink-0 min-h-12">
        <button onClick={() => navigate('/config')} className="text-slate-400 hover:text-slate-600 p-2 -m-1 shrink-0" aria-label="Volver"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg></button>
        {/* En mobile, lo que identifica el partido (equipos) importa más que el título de la pantalla */}
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-sm font-bold text-slate-800 truncate">{matchData.equipoLocal?.nombre} <span className="text-slate-400 font-normal">vs</span> {matchData.equipoVisitante?.nombre}</p>
          <p className="text-[10px] text-slate-400 hidden sm:block">Mesa de Control</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded animate-pulse">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Guardando...</span>
            </div>
          )}
          <div className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Conectado' : 'Desconectado'} />
        </div>
      </header>
      <main className="flex-1 p-2 overflow-y-auto overflow-x-hidden bg-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 max-w-7xl mx-auto pb-20">
          {/* En mobile esta columna va PRIMERO (order-1): es donde se anota el resultado del set,
              la acción que más se usa durante el partido. En desktop vuelve a la derecha. */}
          <div className="order-1 md:order-2 md:col-span-5 flex flex-col gap-2">
            <OverlayScoreboard matchData={matchData} score={{ local: localScore, visitor: visitorScore }} timers={timersState} inline />
            {/* "Cancha en Vivo": inspirado en el controlador de partidos ranked de Overtime-Organizaciones —
                timeline compacta de sets + marcador centrado por equipo, en vez de una lista larga y botones sueltos. */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-3 flex flex-col overflow-hidden min-h-[300px]">
              {/* Timeline de sets: puntitos de color en vez de una lista expandible */}
              <div className="flex flex-wrap justify-center items-center gap-1 min-h-[24px]">
                {sets.filter(s => s.estadoSet === 'finalizado').map((s) => (
                  <div
                    key={s._id}
                    className={`group relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-110 ${
                      s.ganadorSet === 'local' ? 'bg-red-500' : s.ganadorSet === 'visitante' ? 'bg-blue-500' : 'bg-slate-400'
                    }`}
                  >
                    {s.numeroSet}
                    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                      {s.ganadorSet === 'local' ? matchData.equipoLocal?.nombre : s.ganadorSet === 'visitante' ? matchData.equipoVisitante?.nombre : 'Empate'}
                    </div>
                  </div>
                ))}
                {sets.filter(s => s.estadoSet === 'finalizado').length === 0 && (
                  <span className="text-[10px] text-slate-400 italic">Esperando sets...</span>
                )}
                {currentSet && <span className="text-[9px] font-bold text-green-600 animate-pulse bg-green-50 px-2 py-0.5 rounded-full ml-1">EN JUEGO</span>}
              </div>
              {sets.some(s => s.estadoSet === 'finalizado') && (
                <button onClick={() => setShowHistory(!showHistory)} className="text-[10px] text-slate-400 hover:text-slate-600 underline self-center mt-1">
                  {showHistory ? 'Ocultar edición de sets' : 'Editar sets anteriores'}
                </button>
              )}
              {showHistory && (
                <div className="mt-2 space-y-1 pr-1 border-t border-slate-100 pt-2">
                  {sets.filter(s => s.estadoSet === 'finalizado').map(s => (
                    <div key={s._id} className="p-2 bg-slate-50 rounded border border-slate-100 text-xs group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-600">Set {s.numeroSet}</span>
                        <div className="flex gap-1">
                          <button onClick={() => reopenSet(s._id)} className="text-blue-600 hover:bg-blue-100 p-2 rounded" title="Reabrir"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>
                          <button onClick={() => deleteSet(s._id)} className="text-red-600 hover:bg-red-100 p-2 rounded" title="Eliminar"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => changeSetWinner(s._id, 'local')} className={`flex-1 py-1 px-2 rounded text-center border ${s.ganadorSet === 'local' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:border-red-300'}`}>{matchData.equipoLocal?.nombre}</button>
                        <button onClick={() => changeSetWinner(s._id, 'visitante')} className={`flex-1 py-1 px-2 rounded text-center border ${s.ganadorSet === 'visitante' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>{matchData.equipoVisitante?.nombre}</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Marcador centrado por equipo, con el reloj de set en el medio */}
              <div className="flex items-center justify-center gap-2 sm:gap-5 py-3">
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <span className="text-[10px] font-black text-red-600 uppercase tracking-tight truncate max-w-full">{matchData.equipoLocal?.nombre}</span>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-black rounded-xl bg-red-50 border border-red-100 text-red-700 tabular-nums">{localScore}</div>
                </div>
                <div className="flex flex-col items-center gap-0.5 px-1 shrink-0">
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Set</span>
                  <span className={`font-mono text-lg sm:text-xl font-bold ${isSuddenDeathActive ? 'text-purple-600 animate-pulse' : (isSetRunning ? 'text-indigo-700' : 'text-indigo-300')}`}>{isSuddenDeathActive ? `+${formatTime(suddenDeathTime)}` : formatTime(setTimer)}</span>
                  <button onClick={updateSetTimeManual} className="text-indigo-300 hover:text-indigo-500 p-1 -m-1" title="Editar tiempo de set manualmente"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight truncate max-w-full">{matchData.equipoVisitante?.nombre}</span>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-black rounded-xl bg-blue-50 border border-blue-100 text-blue-700 tabular-nums">{visitorScore}</div>
                </div>
              </div>

              {/* Acción principal: arrancar set, elegir ganador, o iniciar el próximo */}
              <div className="flex-1 flex flex-col justify-end">
                {currentSet ? (
                  (!isSetRunning && !isSuddenDeathActive && isMatchRunning) ? (
                    <button onClick={() => { controllerActions?.startSetIfNeeded(); }} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold text-base hover:bg-indigo-700 shadow-md animate-pulse flex flex-col items-center gap-0.5">
                      <span>⏱️ Arrancar cronómetro del Set {currentSet.numeroSet}</span>
                      <span className="text-[11px] font-normal opacity-80 normal-case">El reloj del partido ya está corriendo por separado</span>
                    </button>
                  ) : (
                    <div className={`grid ${matchData.modalidad === 'Cloth' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                      <button onClick={() => finishSet(currentSet._id, 'local')} disabled={isSaving} className={`bg-red-600 text-white rounded-lg font-bold py-3 hover:bg-red-700 transition shadow-sm flex flex-col items-center justify-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}><span className="truncate max-w-full px-1">{matchData.equipoLocal?.nombre}</span><span className="text-[10px] font-normal opacity-75">Gana Set +{matchData.modalidad === 'Cloth' ? '2' : '1'}</span></button>
                      <button onClick={() => finishSet(currentSet._id, 'visitante')} disabled={isSaving} className={`bg-blue-600 text-white rounded-lg font-bold py-3 hover:bg-blue-700 transition shadow-sm flex flex-col items-center justify-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}><span className="truncate max-w-full px-1">{matchData.equipoVisitante?.nombre}</span><span className="text-[10px] font-normal opacity-75">Gana Set +{matchData.modalidad === 'Cloth' ? '2' : '1'}</span></button>
                      {matchData.modalidad === 'Cloth' && <button onClick={() => finishSet(currentSet._id, 'empate')} disabled={isSaving} className={`bg-slate-600 text-white rounded-lg font-bold py-3 hover:bg-slate-700 transition shadow-sm flex flex-col items-center justify-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}><span>Empate</span><span className="text-[10px] font-normal opacity-75">+1 c/u</span></button>}
                    </div>
                  )
                ) : (
                  <button onClick={() => startNewSet(false)} disabled={isSaving} className={`w-full bg-green-600 text-white rounded-lg font-bold text-lg py-4 hover:bg-green-700 shadow-sm flex items-center justify-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664l-3-2z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>Iniciar Set {sets.length + 1}</span></button>
                )}
              </div>

              {/* Toggles secundarios, discretos al pie de la tarjeta */}
              <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer" title="Mostrar/Ocultar Timer de Set en Overlay">
                  <input type="checkbox" checked={showSetTimerOnOverlay} onChange={toggleOverlaySetTimer} />
                  <span>Ver Set en Overlay</span>
                </label>
                {matchData.modalidad === 'Foam' && (
                  <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
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
          </div>

          {/* En mobile esta columna va SEGUNDO (order-2): reloj, timeouts y cierre del partido.
              En desktop vuelve a la izquierda, como antes. */}
          <div className="order-2 md:order-1 md:col-span-7 flex flex-col gap-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 shrink-0">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs text-center">
                <div className="bg-slate-50 p-1.5 rounded"><span className="text-slate-400 block text-[10px] uppercase">Competencia</span><span className="font-semibold text-slate-700 truncate block">{matchData.competencia?.nombre || '-'}</span></div>
                <div className="bg-slate-50 p-1.5 rounded"><span className="text-slate-400 block text-[10px] uppercase">Fase</span><span className="font-semibold text-slate-700 truncate block">{matchData.fase?.nombre || '-'}</span></div>
                <div className="bg-slate-50 p-1.5 rounded"><span className="text-slate-400 block text-[10px] uppercase">Modalidad</span><span className="font-semibold text-slate-700 truncate block">{matchData.modalidad}</span></div>
                <div className="bg-slate-50 p-1.5 rounded"><span className="text-slate-400 block text-[10px] uppercase">Cat</span><span className="font-semibold text-slate-700 truncate block">{matchData.categoria}</span></div>
                <div className="bg-slate-50 p-1.5 rounded col-span-3 sm:col-span-1"><span className="text-slate-400 block text-[10px] uppercase">Estado</span><span className={`font-bold ${matchData.estado === 'en_juego' ? 'text-green-600' : 'text-slate-600'}`}>{matchData.estado?.replace('_',' ').toUpperCase()}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sticky top-0 z-20">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <button onClick={() => changePeriod(1)} className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${period === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>1T</button>
                  <button onClick={() => changePeriod(2)} className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${period === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>2T</button>
                </div>
                <button
                  onClick={toggleMatch}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm shadow-md transition-all ${isMatchRunning ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-green-200'}`}
                >
                  {isMatchRunning ? (
                    <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>Pausar Partido</>
                  ) : (
                    <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>Iniciar Partido</>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reloj de Partido</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono text-3xl sm:text-4xl font-bold leading-none ${isMatchRunning ? 'text-slate-800' : 'text-slate-400'}`}>{formatTime(matchTime)}</span>
                    <button onClick={updateMatchTimeManual} className="text-slate-300 hover:text-slate-500 p-2 -m-1" title="Editar tiempo de partido manualmente"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-2 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Reloj del Set</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono text-3xl sm:text-4xl font-bold leading-none ${isSuddenDeathActive ? 'text-purple-600 animate-pulse' : (isSetRunning ? 'text-indigo-700' : 'text-indigo-300')}`}>{isSuddenDeathActive ? `+${formatTime(suddenDeathTime)}` : formatTime(setTimer)}</span>
                    {!isSuddenDeathActive && <button onClick={updateSetTimeManual} className="text-indigo-300 hover:text-indigo-500 p-2 -m-1" title="Editar tiempo de set manualmente"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex-1 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => pauseMatch('TIMEOUT','local')} className="bg-orange-100 text-orange-800 text-xs font-bold py-3 rounded hover:bg-orange-200">Time Out Local</button>
                <button onClick={() => pauseMatch('TIMEOUT','visitante')} className="bg-orange-100 text-orange-800 text-xs font-bold py-3 rounded hover:bg-orange-200">Time Out Visita</button>
                <button onClick={() => pauseMatch('REVIEW')} className="col-span-2 bg-purple-100 text-purple-800 text-xs font-bold py-3 rounded hover:bg-purple-200">Revisión Arbitral</button>
              </div>
              <div className="mt-auto pt-2 border-t border-slate-100">
                <button
                  onClick={finalizeMatch}
                  disabled={isSaving}
                  className="w-full bg-emerald-600 text-white font-black py-3 rounded-lg hover:bg-emerald-700 transition shadow-md uppercase tracking-widest text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : '🏁 Finalizar Partido'}
                </button>
              </div>
            </div>

            <details className="bg-red-50/60 border border-red-100 rounded-lg p-2 group">
              <summary className="text-[11px] text-red-500 font-bold uppercase tracking-wide cursor-pointer select-none list-none flex items-center gap-1">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                Zona de riesgo
              </summary>
              <div className="mt-2 pt-2 border-t border-red-100">
                <button onClick={resetMatch} className="w-full text-xs text-red-600 hover:text-white hover:bg-red-600 border border-red-300 px-3 py-2.5 rounded transition-colors font-bold">⚠️ Reiniciar Partido (borra todos los sets)</button>
              </div>
            </details>
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction ? CONFIRM_ACTION_COPY[confirmAction.type].title : ''}
        message={confirmAction ? CONFIRM_ACTION_COPY[confirmAction.type].message : ''}
        confirmLabel={confirmAction ? CONFIRM_ACTION_COPY[confirmAction.type].confirmLabel : 'Confirmar'}
        variant={confirmAction ? CONFIRM_ACTION_COPY[confirmAction.type].variant : 'default'}
        onConfirm={executeConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />

      {timeEditModal && (
        <ModalBase
          isOpen={!!timeEditModal}
          onClose={() => setTimeEditModal(null)}
          title={timeEditModal.kind === 'match' ? 'Editar tiempo de partido' : 'Editar tiempo de set'}
          size="sm"
        >
          <div className="p-4 space-y-4">
            <label className="block text-sm text-slate-600">
              Minutos (ej. {timeEditModal.kind === 'match' ? '15.5' : '3'})
              <input
                type="number"
                step="0.1"
                autoFocus
                value={timeEditModal.value}
                onChange={(e) => setTimeEditModal({ ...timeEditModal, value: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmTimeEdit(); }}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ Esto sobreescribe el reloj oficial {timeEditModal.kind === 'match' ? 'del partido' : 'del set'} ahora mismo.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTimeEditModal(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmTimeEdit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </ModalBase>
      )}
    </div>
  );
};

export default ControlPage;

