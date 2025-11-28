/**
 * BroadcastPage - Unified broadcast control with multi-camera support
 * 
 * Features:
 * - WebRTC multi-camera receiving and switching
 * - Program output with overlay integration
 * - Score display (read-only)
 * - Overlay triggers
 * 
 * URL: /broadcast?matchId=xxx
 */

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { socket } from '../../services/socket';
import { authFetch } from '../../shared/utils/authFetch';
import { useWebRTCCompositor } from '../../shared/hooks/useWebRTCCompositor';
import { CameraPreview } from '../camera/components/CameraPreview';
import type { CameraSlot, CameraInfo } from '../../shared/types/camera.types';

const ALL_SLOTS: CameraSlot[] = ['cam1', 'cam2', 'cam3', 'cam4'];

export const BroadcastPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const matchId = searchParams.get('matchId');

  const [localScore, setLocalScore] = useState(0);
  const [visitorScore, setVisitorScore] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [matchData, setMatchData] = useState<any>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [copiedSlot, setCopiedSlot] = useState<string | null>(null);
  
  const programVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC compositor hook
  const {
    cameras,
    streams,
    activeSlot,
    isConnected: isCompositorConnected,
    error: compositorError,
    switchCamera,
    requestState
  } = useWebRTCCompositor({
    socket: isSocketConnected ? socket : null,
    matchId: matchId || ''
  });

  // Program stream peer connections for viewers
  const programPCsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  useEffect(() => {
    if (!socket) return;

    const handleInitViewer = async (data: { viewerSocketId: string; matchId: string }) => {
      const { viewerSocketId } = data;
      if (!programVideoRef.current) return;
      console.log('[Broadcast] init viewer', { viewerSocketId, matchId, activeSlot });

      const programStream = programVideoRef.current.captureStream();
      const tracks = programStream.getTracks();
      console.log('[Broadcast] program stream captured', { tracksCount: tracks.length, trackKinds: tracks.map(t => t.kind) });

      const pc = new RTCPeerConnection({ iceServers: [] });
      console.log('[Broadcast] created program PC for viewer', viewerSocketId);

      // state tracing
      pc.onconnectionstatechange = () => console.log('[Broadcast][PC] connectionState', viewerSocketId, pc.connectionState);
      pc.oniceconnectionstatechange = () => console.log('[Broadcast][PC] iceConnectionState', viewerSocketId, pc.iceConnectionState);
      pc.onsignalingstatechange = () => console.log('[Broadcast][PC] signalingState', viewerSocketId, pc.signalingState);

      // add tracks
      for (const track of tracks) {
        pc.addTrack(track, programStream);
        console.log('[Broadcast] added track to PC', { viewerSocketId, kind: track.kind, id: track.id });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('[Broadcast] sending program ICE to viewer', viewerSocketId, event.candidate);
          socket.emit('program:ice', { targetSocketId: viewerSocketId, matchId, candidate: event.candidate.toJSON() });
        }
      };

      // create offer
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('[Broadcast] created local offer for viewer', viewerSocketId, { type: pc.localDescription?.type, sdpLen: pc.localDescription?.sdp?.length });
        socket.emit('program:offer', { viewerSocketId, matchId, sdp: pc.localDescription });
        programPCsRef.current.set(viewerSocketId, pc);
      } catch (err) {
        console.error('[Broadcast] Failed to create/send program offer', err);
        try { pc.close(); } catch(e){}
      }
    };

    const handleProgramAnswer = (data: any) => {
      const { viewerSocketId, sdp } = data; // viewerSocketId corresponds to viewer that answered
      const pc = programPCsRef.current.get(viewerSocketId);
      console.log('[Broadcast] program answer received', { viewerSocketId, hasPc: !!pc, sdpType: sdp?.type, sdpLen: sdp?.sdp?.length });
      if (!pc) {
        console.warn('[Broadcast] No PC found for program answer', viewerSocketId);
        return;
      }
      pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
        console.log('[Broadcast] setRemoteDescription OK for viewer', viewerSocketId);
      }).catch(err => console.error('[Broadcast] setRemoteDescription failed', err));
    };

    const handleProgramIce = (data: any) => {
      const { fromSocketId, candidate } = data;
      console.log('[Broadcast] program ICE received', { fromSocketId, candidate });
      for (const [viewerId, pc] of programPCsRef.current.entries()) {
        pc.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
          console.log('[Broadcast] added ICE candidate to PC', viewerId);
        }).catch(e => console.warn('[Broadcast] failed adding ICE to PC', viewerId, e));
      }
    };

    socket.on('program:init_viewer', handleInitViewer);
    socket.on('program:answer', handleProgramAnswer);
    socket.on('program:ice', handleProgramIce);

    return () => {
      socket.off('program:init_viewer', handleInitViewer);
      socket.off('program:answer', handleProgramAnswer);
      socket.off('program:ice', handleProgramIce);
      // cleanup pcs
      for (const [viewerId, pc] of programPCsRef.current.entries()) {
        console.log('[Broadcast] closing PC for viewer', viewerId);
        try { pc.close(); } catch (e) {}
      }
      programPCsRef.current.clear();
    };
  }, [socket, matchId]);

  // Socket connection
  useEffect(() => {
    if (!matchId) {
      navigate('/config');
      return;
    }

    loadMatchData();

    function onConnect() {
      setIsSocketConnected(true);
      socket.emit('join_match', matchId);
    }

    function onDisconnect() {
      setIsSocketConnected(false);
    }

    function onScoreUpdate(data: any) {
      if (data.matchId === matchId) {
        setLocalScore(data.localScore);
        setVisitorScore(data.visitorScore);
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('score:updated', onScoreUpdate);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('score:updated', onScoreUpdate);
    };
  }, [matchId, navigate]);

  // Load match data
  const loadMatchData = () => {
    authFetch(`/partidos/${matchId}`).then((data: any) => {
      setMatchData(data);
      setLocalScore(data.marcadorLocal || 0);
      setVisitorScore(data.marcadorVisitante || 0);
    }).catch(console.error);
  };

  // Update program video when active slot changes
  useEffect(() => {
    if (programVideoRef.current && activeSlot) {
      const stream = streams.get(activeSlot);
      console.log('[Broadcast] activeSlot changed', { activeSlot, hasStream: !!stream });
      if (stream) {
        programVideoRef.current.srcObject = stream;
        console.log('[Broadcast] programVideo srcObject set', { tracks: stream.getTracks().map(t => ({ id: t.id, kind: t.kind })) });
      }
    } else if (programVideoRef.current) {
      programVideoRef.current.srcObject = null;
      console.log('[Broadcast] programVideo cleared (no activeSlot)');
    }
  }, [activeSlot, streams]);

  // Trigger overlay
  const triggerOverlay = (type: string, action: 'SHOW' | 'HIDE') => {
    socket.emit('overlay:trigger', {
      matchId,
      type,
      action,
      payload: { message: 'GOLAZO!' }
    });
  };

  // Get camera info by slot
  const getCameraInfo = (slot: CameraSlot): CameraInfo => {
    const camera = cameras.find(c => c.slot === slot);
    return camera || {
      slot,
      label: `Cámara ${slot.replace('cam', '')}`,
      status: 'offline',
      quality: 'medium'
    };
  };

  // Generate and copy camera link
  const copyLink = (slot: CameraSlot) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/camera/${matchId}/${slot}`;
    navigator.clipboard.writeText(link);
    setCopiedSlot(slot);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  if (!matchId) return null;
  if (!matchData) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Cargando partido...</div>;

  const liveCameras = cameras.filter(c => c.status === 'live').length;

  return (
    <div className="h-screen bg-slate-900 flex flex-col overflow-hidden text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex justify-between items-center shrink-0 h-12">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/config')} className="text-slate-400 hover:text-slate-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </button>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-bold text-slate-200">Broadcast Control</h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              {matchData.equipoLocal?.nombre} vs {matchData.equipoVisitante?.nombre}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Cameras status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Cámaras:</span>
            <span className={liveCameras > 0 ? 'text-green-400' : 'text-slate-500'}>
              {liveCameras}/{ALL_SLOTS.length}
            </span>
          </div>
          {/* Connection status */}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-slate-500">{isSocketConnected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </header>

      {/* Compositor error */}
      {compositorError && (
        <div className="bg-red-900/50 text-red-200 px-4 py-2 text-sm flex items-center justify-between">
          <span>{compositorError}</span>
          <button onClick={requestState} className="underline hover:text-white">Reintentar</button>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Cameras */}
        <div className="w-64 bg-slate-850 border-r border-slate-700 p-3 overflow-y-auto flex flex-col">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Fuentes de Video
          </h2>
          
          <div className="space-y-2 flex-1">
            {ALL_SLOTS.map(slot => {
              const camera = getCameraInfo(slot);
              const stream = streams.get(slot) || null;
              
              return (
                <div key={slot}>
                  <CameraPreview
                    slot={slot}
                    label={camera.label}
                    status={camera.status}
                    stream={stream}
                    isActive={activeSlot === slot}
                    onClick={() => switchCamera(slot)}
                  />
                  <button
                    onClick={() => copyLink(slot)}
                    className="mt-1 w-full text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 py-1"
                  >
                    {copiedSlot === slot ? (
                      <>
                        <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copiar link
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick action */}
          <button
            onClick={() => switchCamera(null)}
            disabled={!activeSlot}
            className="mt-3 w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 rounded text-xs"
          >
            Quitar del aire
          </button>
        </div>

        {/* Center: Program Output */}
        <div className="flex-1 flex flex-col p-4 min-w-0">
          {/* Program header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Program Output</h2>
              {activeSlot && (
                <div className="flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded text-xs font-bold">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  {activeSlot.toUpperCase()} AL AIRE
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={showVideo}
                  onChange={(e) => setShowVideo(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-slate-400">Show Video</span>
              </label>
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={`px-2 py-1 rounded text-xs ${showOverlay ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                Overlay {showOverlay ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Program monitor */}
          <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
            {showVideo ? (
              <video
                ref={programVideoRef}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <div className="text-slate-500">Video oculto (showVideo=false)</div>
              </div>
            )}

            {/* No active camera */}
            {!activeSlot && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center text-slate-500">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p>Sin señal</p>
                  <p className="text-xs mt-1">Selecciona una cámara</p>
                </div>
              </div>
            )}

            {/* Overlay iframe */}
            {showOverlay && (
              <iframe
                src={`/overlay?matchId=${matchId}&transparent=${!showVideo}&showVideo=${showVideo}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ border: 'none' }}
                title="Overlay"
              />
            )}
          </div>
        </div>

        {/* Right Sidebar: Score & Controls */}
        <div className="w-56 bg-slate-850 border-l border-slate-700 p-3 overflow-y-auto flex flex-col gap-4">
          
          {/* Score Display */}
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Marcador</h3>
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold">{localScore}</div>
                <div className="text-xs text-slate-500 truncate max-w-16">{matchData.equipoLocal?.nombre?.slice(0, 8)}</div>
              </div>
              <div className="text-slate-600 text-lg">-</div>
              <div className="text-center">
                <div className="text-2xl font-bold">{visitorScore}</div>
                <div className="text-xs text-slate-500 truncate max-w-16">{matchData.equipoVisitante?.nombre?.slice(0, 8)}</div>
              </div>
            </div>
          </div>

          {/* Match Info */}
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Info</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Modalidad</span>
                <span className="font-medium">{matchData.modalidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Categoría</span>
                <span className="font-medium">{matchData.categoria}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado</span>
                <span className={`font-medium ${matchData.estado === 'en_juego' ? 'text-green-400' : ''}`}>
                  {matchData.estado?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Overlay Controls */}
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Overlay Triggers</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => triggerOverlay('GOAL', 'SHOW')} 
                className="bg-green-900/50 text-green-400 border border-green-900/50 hover:bg-green-900 hover:border-green-500 rounded p-2 text-xs font-bold transition"
              >
                GOL
              </button>
              <button 
                onClick={() => triggerOverlay('LOWER_THIRD', 'SHOW')} 
                className="bg-purple-900/50 text-purple-400 border border-purple-900/50 hover:bg-purple-900 hover:border-purple-500 rounded p-2 text-xs font-bold transition"
              >
                INFO
              </button>
              <button 
                onClick={() => triggerOverlay('AD', 'SHOW')} 
                className="bg-yellow-900/50 text-yellow-400 border border-yellow-900/50 hover:bg-yellow-900 hover:border-yellow-500 rounded p-2 text-xs font-bold transition"
              >
                AD
              </button>
              <button 
                onClick={() => triggerOverlay('ALL', 'HIDE')} 
                className="bg-red-900/50 text-red-400 border border-red-900/50 hover:bg-red-900 hover:border-red-500 rounded p-2 text-xs font-bold transition"
              >
                CLEAR
              </button>
            </div>
          </div>

          {/* OBS Instructions */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 mt-auto">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Para OBS</h3>
            <p className="text-xs text-slate-500">
              Captura esta ventana o usa Browser Source con la URL del overlay.
            </p>
            <a 
              href={`/overlay?matchId=${matchId}`} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
            >
              Abrir Overlay →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
