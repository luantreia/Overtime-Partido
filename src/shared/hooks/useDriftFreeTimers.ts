import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

// Mode distinguishes controller (authoritative) vs overlay (passive consumer)
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
    // Logic to decide what to start?
    // For simplicity, start match. If set is pending, maybe start set too?
    // The server handles specific starts.
    // Let's assume "Play" button starts Match Timer.
    sendCommand('START_MATCH');
    // Also start set if needed?
    // If we want to start everything that was running, we might need a RESUME_ALL command.
    // But usually Play starts the match clock.
    // If set clock should run, it should be started explicitly or linked.
    // For now, let's send START_MATCH.
    // If the user wants to start the set, they usually click the set timer button?
    // Or does Play start both?
    // In previous logic: isSetRunning = s.isSetRunning || (s.suddenDeathMode ? s.setTimer > 0 : s.setTimer > 0)
    // So it tried to resume set if it had time.
    // Let's send START_MATCH and START_SET (if applicable).
    // Actually, let's just send START_MATCH and let the user manage the set separately if needed, 
    // OR send a composite command.
    // Let's stick to START_MATCH for now.
    // Wait, if I want to resume the set, I should send START_SET too.
    // But I don't know if I should resume it without checking state.
    // Let's send START_MATCH.
    // If the set was running, it should be resumed?
    // The server doesn't know "was running".
    // Let's add logic: if setTimer > 0, send START_SET too?
    // Better: The UI has separate controls or a master control?
    // The UI has a big Play/Pause button.
    // Let's send START_MATCH.
    // And if setTimer > 0, send START_SET.
    if (state.setTimer > 0) sendCommand('START_SET');
    if (state.suddenDeathMode) sendCommand('START_SUDDEN_DEATH'); // If mode active?
  }, [sendCommand, state.setTimer, state.suddenDeathMode]);

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
    if (state.setTimer > 0) {
        sendCommand('START_SET');
    }
  }, [sendCommand, state.setTimer]);

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

  const controllerActions: ControllerActions | undefined = mode === 'controller' ? {
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
  } : undefined;

  const overlayActions: OverlayActions | undefined = mode === 'overlay' ? { applySocketTimerUpdate } : undefined;

  return { state, controllerActions, overlayActions };
};
