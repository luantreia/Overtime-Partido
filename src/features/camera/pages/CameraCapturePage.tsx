/**
 * CameraCapturePage - Mobile camera capture interface
 * 
 * This page is accessed by mobile devices to capture and stream video
 * to the broadcast compositor via WebRTC.
 * 
 * URL: /camera/:matchId/:slot
 * 
 * Features:
 * - Camera capture with quality selection
 * - Front/back camera switch
 * - Audio mute toggle
 * - Connection status indicator
 * - Local preview
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { socket } from '../../../services/socket';
import { useWebRTCCamera, CaptureSource } from '../../../shared/hooks/useWebRTCCamera';
import type { CameraSlot, VideoQuality } from '../../../shared/types/camera.types';

export const CameraCapturePage: React.FC = () => {
  const { matchId, slot } = useParams<{ matchId: string; slot: string }>();
  const [searchParams] = useSearchParams();
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [showSourcePicker, setShowSourcePicker] = useState(true);
  const [isPortrait, setIsPortrait] = useState(false);

  // Check if source is specified in URL (e.g., ?source=screen)
  const urlSource = searchParams.get('source') as CaptureSource | null;
  const initialSource: CaptureSource = urlSource === 'screen' ? 'screen' : 'camera';

  // Validate slot
  const validSlot = ['cam1', 'cam2', 'cam3', 'cam4'].includes(slot || '') 
    ? (slot as CameraSlot) 
    : null;

  const {
    localStream,
    status,
    quality,
    isMuted,
    isConnected,
    error,
    captureSource,
    startCapture,
    stopCapture,
    setQuality,
    toggleMute,
    switchCamera,
    switchSource
  } = useWebRTCCamera({
    socket: isSocketConnected ? socket : null,
    matchId: matchId || '',
    slot: validSlot || 'cam1',
    label: `Cámara ${slot?.replace('cam', '')}`,
    autoConnect: true,
    initialSource
  });

  // Connect socket on mount
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Detect device orientation
  useEffect(() => {
    const checkOrientation = () => {
      // Only check on mobile devices (not screen sharing)
      if (captureSource === 'screen') {
        setIsPortrait(false);
        return;
      }
      
      // Check window dimensions
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [captureSource]);

  // Auto-start capture ONLY when URL has source param
  useEffect(() => {
    if (urlSource && isSocketConnected && validSlot && !localStream) {
      setShowSourcePicker(false);
      startCapture(urlSource);
    }
  }, [urlSource, isSocketConnected, validSlot, localStream, startCapture]);

  // Video ref for local preview
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      console.log('Setting video srcObject:', localStream);
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch(e => console.warn('Video play error:', e));
    }
  }, [localStream]);

  // Invalid slot
  if (!validSlot) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/50 text-red-200 p-6 rounded-lg text-center max-w-md">
          <h1 className="text-xl font-bold mb-2">Slot Inválido</h1>
          <p>El slot de cámara "{slot}" no es válido.</p>
          <p className="mt-2 text-sm text-red-300">Slots válidos: cam1, cam2, cam3, cam4</p>
        </div>
      </div>
    );
  }

  // Get status color and text
  const getStatusInfo = () => {
    switch (status) {
      case 'live':
        return { color: 'bg-green-500', text: 'En vivo', pulse: true };
      case 'connecting':
        return { color: 'bg-yellow-500', text: 'Conectando...', pulse: true };
      case 'error':
        return { color: 'bg-red-500', text: 'Error', pulse: false };
      default:
        return { color: 'bg-gray-500', text: 'Desconectado', pulse: false };
    }
  };

  const statusInfo = getStatusInfo();

  // Handler for source selection
  const handleSelectSource = (source: CaptureSource) => {
    setShowSourcePicker(false);
    startCapture(source);
  };

  // Handler for retry
  const handleRetry = () => {
    startCapture();
  };

  // Handler for start/stop
  const handleToggleCapture = () => {
    if (localStream) {
      stopCapture();
    } else {
      startCapture();
    }
  };

  // Source picker screen
  if (showSourcePicker && !localStream) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="text-white font-medium">Seleccionar Fuente</div>
          <div className="text-gray-400 text-sm">
            {slot?.toUpperCase()} • Match: {matchId?.slice(-6)}
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full space-y-4">
            <h2 className="text-white text-xl font-bold text-center mb-6">
              ¿Qué quieres transmitir?
            </h2>
            
            {/* Camera option */}
            <button
              onClick={() => handleSelectSource('camera')}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 text-left transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center group-hover:bg-blue-500 transition">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Cámara</h3>
                  <p className="text-gray-400 text-sm">Usa la cámara del dispositivo</p>
                </div>
              </div>
            </button>

            {/* Screen option */}
            <button
              onClick={() => handleSelectSource('screen')}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 text-left transition group"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center group-hover:bg-purple-500 transition">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Pantalla</h3>
                  <p className="text-gray-400 text-sm">Comparte tu pantalla o ventana</p>
                </div>
              </div>
            </button>

            <p className="text-gray-500 text-xs text-center mt-6">
              Tip: Usa ?source=screen o ?source=camera en la URL para saltar este paso
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusInfo.color} ${statusInfo.pulse ? 'animate-pulse' : ''}`} />
            <span className="text-white text-sm font-medium">{statusInfo.text}</span>
          </div>
          {/* Source indicator */}
          <div className="flex items-center gap-1 bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-300">
            {captureSource === 'screen' ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            {captureSource === 'screen' ? 'Pantalla' : 'Cámara'}
          </div>
        </div>
        
        <div className="text-gray-400 text-sm">
          {slot?.toUpperCase()} • Match: {matchId?.slice(-6)}
        </div>
      </header>

      {/* Video Preview */}
      <div className="flex-1 relative bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center p-4">
            <div className="text-center text-white">
              <p className="text-lg font-bold mb-2">Error</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-white text-red-900 rounded-lg font-medium"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* No camera overlay */}
        {!localStream && !error && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>Iniciando cámara...</p>
            </div>
          </div>
        )}

        {/* Portrait orientation warning */}
        {isPortrait && localStream && captureSource === 'camera' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20 p-6">
            <div className="text-center text-white">
              <div className="mb-4 animate-pulse">
                <svg className="w-20 h-20 mx-auto transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">📱 Gira tu dispositivo</h3>
              <p className="text-gray-300 text-sm">
                Coloca el celular en posición horizontal para una mejor transmisión
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                La transmisión continúa en segundo plano
              </div>
            </div>
          </div>
        )}

        {/* Connection status badge */}
        {isConnected && (
          <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Transmitiendo
          </div>
        )}

        {/* Mute indicator */}
        {isMuted && (
          <div className="absolute top-4 left-4 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
            Silenciado
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-4 safe-area-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* Switch Source */}
          <button
            onClick={() => switchSource(captureSource === 'camera' ? 'screen' : 'camera')}
            disabled={!localStream}
            className="flex flex-col items-center gap-1 text-white disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
              {captureSource === 'camera' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <span className="text-xs">{captureSource === 'camera' ? 'Pantalla' : 'Cámara'}</span>
          </button>

          {/* Switch Camera (only for camera source) */}
          <button
            onClick={switchCamera}
            disabled={!localStream || captureSource !== 'camera'}
            className="flex flex-col items-center gap-1 text-white disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-xs">Voltear</span>
          </button>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            disabled={!localStream}
            className="flex flex-col items-center gap-1 text-white disabled:opacity-50"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-600' : 'bg-gray-700'}`}>
              {isMuted ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
            <span className="text-xs">{isMuted ? 'Activar' : 'Silenciar'}</span>
          </button>

          {/* Quality Selector */}
          <div className="flex flex-col items-center gap-1 text-white">
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as VideoQuality)}
              disabled={!localStream}
              className="w-12 h-12 rounded-full bg-gray-700 text-center text-xs appearance-none cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ textAlignLast: 'center' }}
            >
              <option value="low">360p</option>
              <option value="medium">720p</option>
              <option value="high">1080p</option>
            </select>
            <span className="text-xs">Calidad</span>
          </div>

          {/* Stop/Start */}
          <button
            onClick={handleToggleCapture}
            className="flex flex-col items-center gap-1 text-white"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${localStream ? 'bg-red-600' : 'bg-green-600'}`}>
              {localStream ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
            <span className="text-xs">{localStream ? 'Detener' : 'Iniciar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapturePage;
