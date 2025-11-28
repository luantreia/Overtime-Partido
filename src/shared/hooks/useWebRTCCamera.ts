/**
 * useWebRTCCamera - Hook for camera source (mobile devices)
 * 
 * Handles:
 * - getUserMedia for camera capture
 * - WebRTC peer connection to compositor
 * - Signaling via Socket.io
 * - Quality switching
 * - Audio muting
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { 
  CameraSlot, 
  CameraStatus, 
  VideoQuality, 
  VIDEO_PRESETS,
  CameraState,
  CameraJoinResult 
} from '../types/camera.types';

export type CaptureSource = 'camera' | 'screen';

interface UseWebRTCCameraOptions {
  socket: Socket | null;
  matchId: string;
  slot: CameraSlot;
  label?: string;
  autoConnect?: boolean;
  initialSource?: CaptureSource;
}

interface UseWebRTCCameraReturn {
  // State
  localStream: MediaStream | null;
  status: CameraStatus;
  quality: VideoQuality;
  isMuted: boolean;
  isConnected: boolean;
  error: string | null;
  captureSource: CaptureSource;
  
  // Actions
  startCapture: (source?: CaptureSource) => Promise<void>;
  stopCapture: () => void;
  setQuality: (quality: VideoQuality) => Promise<void>;
  toggleMute: () => void;
  switchCamera: () => Promise<void>;
  switchSource: (source: CaptureSource) => Promise<void>;
}

const VIDEO_PRESETS_LOCAL: Record<VideoQuality, MediaTrackConstraints> = {
  low: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } },
  medium: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
  high: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }
};

export function useWebRTCCamera({
  socket,
  matchId,
  slot,
  label,
  autoConnect = true,
  initialSource = 'camera'
}: UseWebRTCCameraOptions): UseWebRTCCameraReturn {
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('offline');
  const [quality, setQualityState] = useState<VideoQuality>('medium');
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [captureSource, setCaptureSource] = useState<CaptureSource>(initialSource);
  const [hasIceServers, setHasIceServers] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Start camera or screen capture
  const startCapture = useCallback(async (source?: CaptureSource) => {
    const sourceToUse = source ?? captureSource;
    
    try {
      setStatus('connecting');
      setError(null);
      setCaptureSource(sourceToUse);

      let stream: MediaStream;

      if (sourceToUse === 'screen') {
        // Screen capture
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true // System audio if available
        });
        
        // Try to add microphone audio as well
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getAudioTracks().forEach(track => {
            displayStream.addTrack(track);
          });
        } catch (audioErr) {
          console.warn('Could not add microphone audio to screen share:', audioErr);
        }
        
        stream = displayStream;
        
        // Handle user stopping screen share via browser UI
        stream.getVideoTracks()[0].onended = () => {
          stopCapture();
        };
      } else {
        // Camera capture
        const constraints: MediaStreamConstraints = {
          video: {
            ...VIDEO_PRESETS_LOCAL[quality],
            facingMode: { ideal: facingMode }
          },
          audio: true
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      setLocalStream(stream);
      console.log('Stream created:', stream.id, 'tracks:', stream.getTracks().map(t => t.kind));
      
      // Apply mute state if needed
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });

    } catch (err: any) {
      console.error('Error accessing media:', err);
      if (err.name === 'NotAllowedError') {
        setError(sourceToUse === 'screen' ? 'Screen sharing was cancelled' : 'Camera permission denied');
      } else {
        setError(err.message || `Failed to access ${sourceToUse}`);
      }
      setStatus('error');
    }
  }, [quality, facingMode, isMuted, captureSource]);

  // Stop camera capture - use ref to avoid dependency issues
  const localStreamRef = useRef<MediaStream | null>(null);
  
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const stopCapture = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      console.log('Stopping stream:', stream.id);
      stream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    setStatus('offline');
    setIsConnected(false);
  }, []);

  // Change video quality
  const setQuality = useCallback(async (newQuality: VideoQuality) => {
    setQualityState(newQuality);
    
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          await videoTrack.applyConstraints(VIDEO_PRESETS_LOCAL[newQuality]);
        } catch (err) {
          console.warn('Could not apply quality constraints:', err);
        }
      }
    }
    
    // Notify server
    socket?.emit('camera:quality', { quality: newQuality });
  }, [localStream, socket]);

  // Toggle audio mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const newMuted = !isMuted;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMuted;
      });
      setIsMuted(newMuted);
    }
  }, [localStream, isMuted]);

  // Switch between front/back camera
  const switchCamera = useCallback(async () => {
    if (captureSource !== 'camera') return; // Only works for camera
    
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (localStream) {
      // Stop current video track
      localStream.getVideoTracks().forEach(track => track.stop());
      
      try {
        // Get new video track with different camera
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...VIDEO_PRESETS_LOCAL[quality],
            facingMode: { ideal: newFacingMode }
          }
        });
        
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        // Replace track in local stream
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
        }
        localStream.addTrack(newVideoTrack);
        
        // Replace track in peer connection
        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
          }
        }
      } catch (err: any) {
        console.error('Error switching camera:', err);
        setError('Failed to switch camera');
      }
    }
  }, [facingMode, localStream, quality, captureSource]);

  // Switch between camera and screen capture
  const switchSource = useCallback(async (newSource: CaptureSource) => {
    if (newSource === captureSource) return;
    
    // Stop current stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Start new capture
    await startCapture(newSource);
  }, [captureSource, localStream, startCapture]);

  // Create WebRTC peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('camera:ice', {
          matchId,
          slot,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      
      switch (pc.iceConnectionState) {
        case 'connected':
        case 'completed':
          setStatus('live');
          setIsConnected(true);
          socket?.emit('camera:status', { status: 'live' });
          break;
        case 'disconnected':
        case 'failed':
          setStatus('error');
          setIsConnected(false);
          socket?.emit('camera:status', { status: 'error' });
          break;
        case 'closed':
          setStatus('offline');
          setIsConnected(false);
          break;
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, matchId, slot]);

  // Add local stream to peer connection and create offer
  const initiateConnection = useCallback(async () => {
    if (!localStream || !socket) return;

    // Clear pending candidates - they're from old connections
    pendingIceCandidatesRef.current = [];

    const pc = createPeerConnection();

    // Add all tracks to peer connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Create and send offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit('camera:offer', {
        matchId,
        slot,
        sdp: pc.localDescription
      });
    } catch (err: any) {
      console.error('Error creating offer:', err);
      setError('Failed to create WebRTC offer');
      setStatus('error');
    }
  }, [localStream, socket, matchId, slot, createPeerConnection]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle camera state updates (contains ICE servers)
    const handleCameraState = (state: CameraState) => {
      if (state.matchId === matchId && state.iceServers) {
        console.log('Received ICE servers:', state.iceServers.length);
        iceServersRef.current = state.iceServers;
        setHasIceServers(true);
      }
    };

    // Handle join result
    const handleJoinResult = (result: CameraJoinResult) => {
      if (!result.success) {
        setError(result.error || 'Failed to join');
        setStatus('error');
      }
    };

    // Handle answer from compositor
    const handleAnswer = async (data: { matchId: string; slot: CameraSlot; sdp: RTCSessionDescriptionInit }) => {
      if (data.matchId !== matchId || data.slot !== slot) return;
      
      const pc = peerConnectionRef.current;
      if (!pc) return;

      // Ignore if already have remote description (happens with multiple compositors)
      if (pc.remoteDescription) {
        console.log('Ignoring duplicate answer - already have remote description');
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        
        // Now process any pending ICE candidates
        for (const candidate of pendingIceCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn('Error adding queued ICE candidate:', err);
          }
        }
        pendingIceCandidatesRef.current = [];
      } catch (err) {
        console.error('Error setting remote description:', err);
        setError('Failed to establish connection');
        setStatus('error');
      }
    };

    // Handle ICE candidate from compositor
    const handleIceCandidate = async (data: { matchId: string; slot: CameraSlot; candidate: RTCIceCandidateInit }) => {
      if (data.matchId !== matchId || data.slot !== slot) return;

      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription) {
        // Queue candidate for later
        pendingIceCandidatesRef.current.push(data.candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.warn('Error adding ICE candidate:', err);
      }
    };

    // Handle new source request (compositor wants us to send offer)
    const handleNewSourceRequest = (data?: { matchId: string; slot: CameraSlot }) => {
      // If data provided, check it matches our camera
      if (data && (data.matchId !== matchId || data.slot !== slot)) return;
      
      // Don't create new connection if already connected
      const pc = peerConnectionRef.current;
      if (pc && (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed')) {
        console.log('Ignoring offer request - already connected');
        return;
      }
      
      console.log('Compositor requested offer, localStream:', !!localStream);
      if (localStream) {
        initiateConnection();
      }
    };

    socket.on('camera:state', handleCameraState);
    socket.on('camera:join_result', handleJoinResult);
    socket.on('camera:answer', handleAnswer);
    socket.on('camera:ice', handleIceCandidate);
    socket.on('camera:request_offer', handleNewSourceRequest);

    return () => {
      socket.off('camera:state', handleCameraState);
      socket.off('camera:join_result', handleJoinResult);
      socket.off('camera:answer', handleAnswer);
      socket.off('camera:ice', handleIceCandidate);
      socket.off('camera:request_offer', handleNewSourceRequest);
    };
  }, [socket, matchId, slot, localStream, status, initiateConnection]);

  // Join room and register camera when socket connects
  useEffect(() => {
    if (!socket || !autoConnect) return;

    socket.emit('camera:join', { matchId, slot, label });
    socket.emit('camera:status', { status: 'connecting' });

    return () => {
      socket.emit('camera:leave');
    };
  }, [socket, matchId, slot, label, autoConnect]);

  // Initiate WebRTC connection when we have a stream and ICE servers
  useEffect(() => {
    if (localStream && hasIceServers && socket && status === 'connecting') {
      console.log('Initiating WebRTC connection...');
      initiateConnection();
    }
  }, [localStream, socket, status, hasIceServers, initiateConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  return {
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
  };
}
