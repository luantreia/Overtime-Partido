import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socket } from '../../services/socket';
import { authFetch } from '../../shared/utils/authFetch';
import OverlayScoreboard from './OverlayScoreboard';
import { useDriftFreeTimers } from '../../shared/hooks/useDriftFreeTimers';
import { useWebRTCCompositor } from '../../shared/hooks/useWebRTCCompositor';

export const OverlayPage = () => {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const transparent = searchParams.get('transparent') === 'true';

  const [score, setScore] = useState({ local: 0, visitor: 0 });
  const [activeOverlay, setActiveOverlay] = useState<{type: string, payload?: any} | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [showSetTimer, setShowSetTimer] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const { state: timersState, overlayActions } = useDriftFreeTimers({ mode: 'overlay', matchId, socket });

  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isDataFlowing, setIsDataFlowing] = useState(false);
  
  // Video ref for active camera
  const videoRef = useRef<HTMLVideoElement>(null);

  // WebRTC compositor hook - only active if not in transparent mode (for OBS Browser Source)
  const {
    streams,
    activeSlot,
  } = useWebRTCCompositor({
    socket: !transparent && isSocketConnected ? socket : null,
    matchId: matchId || ''
  });

  // Update video when active camera changes
  useEffect(() => {
    if (videoRef.current && activeSlot && !transparent) {
      const stream = streams.get(activeSlot);
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [activeSlot, streams, transparent]);

  // Track socket connection
  useEffect(() => {
    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    if (socket.connected) {
      setIsSocketConnected(true);
    }
    
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Watchdog: Request sync if no data received for 2 seconds (Aggressive recovery)
  useEffect(() => {
    const watchdog = setInterval(() => {
        const silenceDuration = Date.now() - lastUpdate;
        
        if (silenceDuration > 2000) {
            setIsDataFlowing(false);
            if (socket.connected) {
                // Re-join room just in case
                socket.emit('join_match', matchId);
                socket.emit('timer:request_sync', matchId);
            } else {
                socket.connect();
            }
        } else {
            setIsDataFlowing(true);
        }
    }, 2000);
    return () => clearInterval(watchdog);
  }, [lastUpdate, matchId]);

    // Timers now handled by hook drift-free logic; no local simulation needed

  useEffect(() => {
    if (!matchId) return;

    // Cargar datos iniciales
    authFetch(`/partidos/${matchId}`).then((data: any) => {
      setMatchData(data);
      setScore({ local: data.marcadorLocal || 0, visitor: data.marcadorVisitante || 0 });
      
      // Initialize timers from match data if available
      if (data.timerMatchValue !== undefined) {
          let restoredTime = data.timerMatchValue;
          // If running, adjust for elapsed time (simple approximation)
          if (data.timerMatchRunning && data.timerMatchLastUpdate) {
              const elapsed = Math.floor((Date.now() - new Date(data.timerMatchLastUpdate).getTime()) / 1000);
              restoredTime = Math.max(0, restoredTime - elapsed);
          }
          
            overlayActions?.applySocketTimerUpdate({ matchTime: restoredTime, period: data.period || 1, isMatchRunning: data.timerMatchRunning || false });
      }

      // Fetch active set for Set Timer
      authFetch<any[]>(`/set-partido?partido=${matchId}`).then((sets) => {
          const currentSet = sets.find(s => s.estadoSet === 'en_juego');
          if (currentSet) {
             let setTime = currentSet.timerSetValue || 0;
             let sdTime = currentSet.timerSuddenDeathValue || 0;
             
             // Adjust for elapsed time if running
             if (currentSet.timerSetRunning && currentSet.timerSetLastUpdate) {
                 const elapsed = Math.floor((Date.now() - new Date(currentSet.timerSetLastUpdate).getTime()) / 1000);
                 setTime = Math.max(0, setTime - elapsed);
             }
             if (currentSet.timerSuddenDeathRunning && currentSet.timerSetLastUpdate) {
                 const elapsed = Math.floor((Date.now() - new Date(currentSet.timerSetLastUpdate).getTime()) / 1000);
                 sdTime += elapsed;
             }

             overlayActions?.applySocketTimerUpdate({
               setTimer: setTime,
               suddenDeathTime: sdTime,
               isSetRunning: currentSet.timerSetRunning || false,
               isSuddenDeathActive: currentSet.timerSuddenDeathRunning || false,
               suddenDeathMode: currentSet.suddenDeathMode || false
             });
          }
      }).catch(console.error);

    }).catch(console.error);

    socket.on('connect', () => {
        // console.log('[Overlay] Socket Connected:', socket.id);
        socket.emit('join_match', matchId);
        socket.emit('timer:request_sync', matchId);
    });

    socket.on('disconnect', () => {
        // console.log('[Overlay] Socket Disconnected');
    });

    if (socket.connected) {
        // console.log('[Overlay] Socket already connected, joining match:', matchId);
        socket.emit('join_match', matchId);
        socket.emit('timer:request_sync', matchId);
    } else {
        // console.log('[Overlay] Socket not connected, connecting...');
        socket.connect();
    }

    socket.on('score:update', (data) => {
      // console.log('[Overlay] Score Update (Direct):', data);
      setScore({ local: data.localScore, visitor: data.visitorScore });
    });

    socket.on('score:updated', (data) => {
      // console.log('[Overlay] Score Update (Broadcast):', data);
      setScore({ local: data.localScore, visitor: data.visitorScore });
    });

    socket.on('timer:update', (data) => {
      setLastUpdate(Date.now());
      setIsDataFlowing(true);
      overlayActions?.applySocketTimerUpdate(data);
    });

    socket.on('overlay:triggered', (data) => {
      // console.log('[Overlay] Trigger:', data);
      if (data.action === 'SHOW') {
        setActiveOverlay({ type: data.type, payload: data.payload });
        
        // Auto-hide animation
        if (['GOAL', 'SET_WINNER', 'TIMEOUT', 'REVIEW'].includes(data.type)) {
          setTimeout(() => setActiveOverlay(null), 2000);
        }
      } else {
        setActiveOverlay(null);
        // If hiding overlay (Resume), force a sync to ensure timer starts
        // console.log('[Overlay] Overlay Hidden (Resume), requesting sync...');
        socket.emit('timer:request_sync', matchId);
      }
    });

    socket.on('overlay:config', (data) => {
      if (data.showSetTimer !== undefined) setShowSetTimer(data.showSetTimer);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('score:update');
      socket.off('score:updated');
      socket.off('timer:update');
      socket.off('overlay:triggered');
      socket.off('overlay:config');
      // socket.disconnect(); // Removed to prevent aggressive disconnection
    };
  }, [matchId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!matchId) return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">⚠️ Falta ID del Partido</h1>
        <p className="mb-4">No se especificó qué partido mostrar.</p>
        <p className="text-sm text-gray-400">Usa el botón "Overlay" desde la pantalla de Configuración o Botonera.</p>
      </div>
    </div>
  );
  if (!matchData) return <div className="text-white p-10 bg-gray-800">Cargando datos del partido...</div>;

  // Determine background: transparent for OBS layer, black with video for full stream
  const showVideo = !transparent;

  return (
    <div className={`w-screen h-screen overflow-hidden relative font-sans ${transparent ? 'bg-transparent' : 'bg-black'}`}>
      
      {/* VIDEO LAYER - Only shown when not in transparent mode */}
      {showVideo && (
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-contain"
          />
          
          {/* No camera placeholder */}
          {!activeSlot && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-gray-500">
                <svg className="w-24 h-24 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-xl">Esperando cámara...</p>
                <p className="text-sm mt-2">Selecciona una cámara en el Broadcast Control</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OVERLAY LAYER - Always on top */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Connection Status Indicator */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full transition-colors duration-500 ${isDataFlowing ? 'bg-green-500 opacity-50' : 'bg-red-500 opacity-80 animate-pulse'}`} title={isDataFlowing ? "Recibiendo datos" : "Sin conexión/datos"} />

        {/* SCOREBOARD (Top Left) */}
        <OverlayScoreboard matchData={matchData} score={score} timers={timersState} showSetTimer={showSetTimer} />

        {/* ANIMATION LAYER (Centered) */}
        {activeOverlay?.type === 'GOAL' && (
          <div className="absolute inset-0 flex items-center justify-center animate-bounce">
            <div className="bg-green-600 text-white text-9xl font-black py-10 px-20 rounded-3xl shadow-lg border-8 border-white transform rotate-[-5deg]">
              GOL !!!
            </div>
          </div>
        )}

        {/* TIMEOUT / REVIEW / SET WINNER */}
        {(activeOverlay?.type === 'TIMEOUT' || activeOverlay?.type === 'REVIEW' || activeOverlay?.type === 'SET_WINNER') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white text-gray-900 px-10 py-6 rounded-xl shadow-2xl border-4 border-blue-600 text-center transform scale-110">
              <h2 className="text-4xl font-black uppercase mb-2">{activeOverlay.payload?.title}</h2>
              <p className="text-2xl text-gray-600 font-bold">{activeOverlay.payload?.subtitle}</p>
            </div>
          </div>
        )}

        {/* LOWER THIRD (Bottom Left) */}
        {activeOverlay?.type === 'LOWER_THIRD' && (
          <div className="absolute bottom-20 left-20 animate-slide-in-left">
            <div className="bg-white text-gray-900 px-8 py-4 rounded-r-full shadow-xl border-l-8 border-blue-600">
              <h3 className="text-2xl font-bold">JUGADOR DESTACADO</h3>
              <p className="text-lg text-gray-600">#10 Lionel Messi</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
