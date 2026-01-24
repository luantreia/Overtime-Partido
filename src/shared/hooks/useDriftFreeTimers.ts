import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import type { Socket } from 'socket.io-client';

// Mode distinguishes controller (authoritative) vs overlay (passive consumer)
// ... (rest of imports/types)
export type DriftTimerMode = 'controller' | 'overlay';

export interface DriftTimersState {
  matchTime: number; // seconds remaining
  setTimer: number;  // seconds remaining in current set
  suddenDeathTime: number; // seconds elapsed in sudden death
  period: number;
  isMatchRunning: boolean;
  isSetRunning: boolean;
  isSuddenDeathActive: boolean;
  suddenDeathMode: boolean;
  // Drift-free sync metadata (Server timestamp)
  serverTimestamp?: number;
}

export interface UseDriftFreeTimersParams {
  mode: DriftTimerMode;
  matchId: string | null;
  socket: Socket;
  // Initial defaults (used only before first sync)
  initialMatchTime?: number;
  initialSetTime?: number;
  initialPeriod?: number;
}

export interface ControllerActions {
  startOrResume: () => void;
  pauseAll: () => void;
  pauseSetOnly: () => void;
  setMatchTimeManual: (seconds: number) => void;
  setSetTimeManual: (seconds: number) => void;
  changePeriod: (p: number) => void;
  setSuddenDeathMode: (enabled: boolean) => void;
  startSuddenDeath: () => void;
  stopSuddenDeath: () => void;
  startSetIfNeeded: () => void;
  resetAll: () => void;
}

export interface OverlayActions {
  applySocketTimerUpdate: (data: Partial<DriftTimersState>) => void;
}

export const useDriftFreeTimers = (params: UseDriftFreeTimersParams) => {
  const { mode, matchId, socket, initialMatchTime = 20 * 60, initialSetTime = 3 * 60, initialPeriod = 1 } = params;

  const [state, setState] = useState<DriftTimersState>(() => ({
    matchTime: initialMatchTime,
    setTimer: initialSetTime,
    suddenDeathTime: 0,
    period: initialPeriod,
    isMatchRunning: false,
    isSetRunning: false,
    isSuddenDeathActive: false,
    suddenDeathMode: false,
    serverTimestamp: undefined
  }));

  // Refs to state for stable callbacks
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Listen for server updates (Source of Truth)
  useEffect(() => {
    if (!matchId) return;

    const handleUpdate = (data: any) => {
        // Map server payload to local state
        setState(s => ({
            ...s,
            matchTime: data.matchRemaining,
            setTimer: data.setRemaining,
            suddenDeathTime: data.suddenDeathRemaining,
            period: data.period,
            isMatchRunning: data.isMatchRunning,
            isSetRunning: data.isSetRunning,
            isSuddenDeathActive: data.isSuddenDeathActive,
            suddenDeathMode: data.suddenDeathMode,
            serverTimestamp: data.serverTimestamp
        }));
    };

    socket.on('timer:update', handleUpdate);

    // Request initial sync
    socket.emit('timer:request_sync', matchId);

    return () => {
        socket.off('timer:update', handleUpdate);
    };
  }, [matchId, socket]);

  // Actions (controller) - Send commands to server
  const sendCommand = useCallback((action: string, payload: any = {}) => {
      if (mode !== 'controller' || !matchId) return;
      socket.emit('timer:command', { matchId, action, payload });
  }, [mode, matchId, socket]);

  const startOrResume = useCallback(() => {
    sendCommand('START_MATCH');
    if (stateRef.current.setTimer > 0) sendCommand('START_SET');
    if (stateRef.current.suddenDeathMode) sendCommand('START_SUDDEN_DEATH');
  }, [sendCommand]);

  const pauseAll = useCallback(() => {
    sendCommand('PAUSE_ALL');
  }, [sendCommand]);

  const setMatchTimeManual = useCallback((seconds: number) => {
    sendCommand('SET_MATCH_TIME', { seconds });
  }, [sendCommand]);

  const setSetTimeManual = useCallback((seconds: number) => {
    sendCommand('SET_SET_TIME', { seconds });
  }, [sendCommand]);

  const changePeriod = useCallback((p: number) => {
    sendCommand('CHANGE_PERIOD', { period: p });
  }, [sendCommand]);

  const setSuddenDeathMode = useCallback((enabled: boolean) => {
    sendCommand('SET_SUDDEN_DEATH_MODE', { enabled });
  }, [sendCommand]);

  const startSuddenDeath = useCallback(() => {
    sendCommand('START_SUDDEN_DEATH');
  }, [sendCommand]);

  const stopSuddenDeath = useCallback(() => {
    sendCommand('STOP_SUDDEN_DEATH');
  }, [sendCommand]);

  const startSetIfNeeded = useCallback(() => {
    if (stateRef.current.setTimer > 0) {
        sendCommand('START_SET');
    }
  }, [sendCommand]);

  const resetAll = useCallback(() => {
    sendCommand('RESET_ALL');
  }, [sendCommand]);

  const pauseSetOnly = useCallback(() => {
    sendCommand('PAUSE_SET_ONLY');
  }, [sendCommand]);

  // Overlay actions are now just a no-op or helper, since state updates automatically via effect
  const applySocketTimerUpdate = useCallback((data: Partial<DriftTimersState>) => {
    // No-op, handled by useEffect
  }, []);

  const controllerActions: ControllerActions | undefined = useMemo(() => {
    if (mode !== 'controller') return undefined;
    return {
      startOrResume,
      pauseAll,
      pauseSetOnly,
      setMatchTimeManual,
      setSetTimeManual,
      changePeriod,
      setSuddenDeathMode,
      startSuddenDeath,
      stopSuddenDeath,
      startSetIfNeeded,
      resetAll
    };
  }, [
    mode,
    startOrResume,
    pauseAll,
    pauseSetOnly,
    setMatchTimeManual,
    setSetTimeManual,
    changePeriod,
    setSuddenDeathMode,
    startSuddenDeath,
    stopSuddenDeath,
    startSetIfNeeded,
    resetAll
  ]);

  const overlayActions: OverlayActions | undefined = useMemo(() => {
    if (mode !== 'overlay') return undefined;
    return { applySocketTimerUpdate };
  }, [mode, applySocketTimerUpdate]);

  return { state, controllerActions, overlayActions };
};
