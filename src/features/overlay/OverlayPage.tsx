import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { socket } from '../../services/socket';
import { authFetch } from '../../shared/utils/authFetch';
import OverlayScoreboard from './OverlayScoreboard';
import { useDriftFreeTimers } from '../../shared/hooks/useDriftFreeTimers';

export const OverlayPage = () => {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const transparent = searchParams.get('transparent') !== 'false';
  const showVideoParam = searchParams.get('showVideo');
  // showVideo explicit param if provided, otherwise true (show video by default)
  const showVideo = showVideoParam !== 'false';

  const [score, setScore] = useState({ local: 0, visitor: 0 });
  const [activeOverlay, setActiveOverlay] = useState<{type: string, payload?: any} | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [showSetTimer, setShowSetTimer] = useState(true);
  const [showScoreboard, setShowScoreboard] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const { state: timersState, overlayActions } = useDriftFreeTimers({ mode: 'overlay', matchId, socket });

  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isDataFlowing, setIsDataFlowing] = useState(false);
  const [forceReconnect, setForceReconnect] = useState(0);
  
  // Video ref for program stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const programPcRef = useRef<RTCPeerConnection | null>(null);

  // PROGRAM VIEWER: request the composed program stream from the compositor
  useEffect(() => {
    if (!showVideo || !isSocketConnected || !matchId) return;

    // Ask server to connect us to the program stream
    console.log('[Overlay] requesting program viewer join', { matchId });
    socket.emit('program:viewer_join', { matchId });

    const handleOffer = async (data: any) => {
      const { sdp, compositorSocketId } = data;
      console.log('[Overlay] program:offer received', { compositorSocketId, sdpType: sdp?.type, sdpLen: sdp?.sdp?.length });
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        programPcRef.current = pc;

        pc.ontrack = (event) => {
          console.log('[Overlay][PC] ontrack', { streams: event.streams.length, tracks: event.streams[0]?.getTracks().map((t: any) => ({ id: t.id, kind: t.kind })) });
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
            videoRef.current.play().then(() => {
              console.log('[Overlay] video play OK on track');
            }).catch((e) => console.warn('[Overlay] play error on track:', e));
          }
        };

        pc.onicecandidate = (ev) => {
          if (ev.candidate) {
            console.log('[Overlay][PC] sending ICE to compositor', ev.candidate);
            socket.emit('program:ice', { targetSocketId: compositorSocketId, matchId, candidate: ev.candidate.toJSON() });
          }
        };

        pc.onconnectionstatechange = () => console.log('[Overlay][PC] connectionState', pc.connectionState);
        pc.oniceconnectionstatechange = () => console.log('[Overlay][PC] iceConnectionState', pc.iceConnectionState);
        pc.onsignalingstatechange = () => console.log('[Overlay][PC] signalingState', pc.signalingState);

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log('[Overlay] setRemoteDescription OK');
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('[Overlay] created local answer', { type: pc.localDescription?.type, sdpLen: pc.localDescription?.sdp?.length });
        socket.emit('program:answer', { compositorSocketId, matchId, sdp: pc.localDescription });
      } catch (err) {
        console.error('[Overlay] Failed to handle program offer', err);
      }
    };

    const handleProgramIce = (data: any) => {
      const { candidate } = data;
      console.log('[Overlay] program ICE received', { candidate });
      if (programPcRef.current && candidate) {
        programPcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
          console.log('[Overlay] added ICE candidate');
        }).catch(e => console.warn('[Overlay] addIceCandidate failed', e));
      }
    };

    socket.on('program:offer', handleOffer);
    socket.on('program:ice', handleProgramIce);

    return () => {
      socket.off('program:offer', handleOffer);
      socket.off('program:ice', handleProgramIce);
      if (programPcRef.current) {
        try { programPcRef.current.close(); } catch (e) {}
        programPcRef.current = null;
      }
      if (videoRef.current) {
        try { videoRef.current.pause(); videoRef.current.srcObject = null; } catch (e) {}
      }
    };
  }, [showVideo, isSocketConnected, matchId, forceReconnect]);

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

  // (Removed compositor state polling - overlay now requests program stream when needed)

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
      if (data.showScoreboard !== undefined) setShowScoreboard(data.showScoreboard);
    });

    socket.on('camera:switched', (data) => {
      console.log('[Overlay] Camera switched, forcing reconnect', data);
      setForceReconnect(prev => prev + 1);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('score:update');
      socket.off('score:updated');
      socket.off('timer:update');
      socket.off('overlay:triggered');
      socket.off('overlay:config');
      socket.off('camera:switched');
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
  // `showVideo` computed from query params above

  return (
    <div className={`w-screen h-screen overflow-hidden relative font-sans ${(transparent || !showVideo) ? 'bg-transparent' : 'bg-black'}`}>
      
      {/* VIDEO LAYER - Only shown when showVideo is true */}
      {showVideo && (
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* OVERLAY LAYER - Always on top */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Connection Status Indicator */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full transition-colors duration-500 ${isDataFlowing ? 'bg-green-500 opacity-50' : 'bg-red-500 opacity-80 animate-pulse'}`} title={isDataFlowing ? "Recibiendo datos" : "Sin conexión/datos"} />

        {/* SCOREBOARD (Top Left) */}
        {showScoreboard && (
          <OverlayScoreboard matchData={matchData} score={score} timers={timersState} showSetTimer={showSetTimer} />
        )}

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
