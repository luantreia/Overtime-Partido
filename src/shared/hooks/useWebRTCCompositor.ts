/**
 * useWebRTCCompositor - Hook for broadcast compositor
 * 
 * Handles:
 * - Receiving multiple WebRTC streams from cameras
 * - Managing peer connections for each camera
 * - Camera switching
 * - State synchronization
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { 
  CameraSlot, 
  CameraInfo, 
  CameraState,
  CompositorJoinResult 
} from '../types/camera.types';

interface PeerConnectionInfo {
  pc: RTCPeerConnection;
  stream: MediaStream | null;
}

interface UseWebRTCCompositorOptions {
  socket: Socket | null;
  matchId: string;
}

interface UseWebRTCCompositorReturn {
  // State
  cameras: CameraInfo[];
  streams: Map<CameraSlot, MediaStream>;
  activeSlot: CameraSlot | null;
  isConnected: boolean;
  error: string | null;
  iceServers: RTCIceServer[];
  
  // Actions
  switchCamera: (slot: CameraSlot | null) => void;
  requestState: () => void;
}

export function useWebRTCCompositor({
  socket,
  matchId
}: UseWebRTCCompositorOptions): UseWebRTCCompositorReturn {
  
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [streams, setStreams] = useState<Map<CameraSlot, MediaStream>>(new Map());
  const [activeSlot, setActiveSlot] = useState<CameraSlot | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([]);
  
  const peerConnectionsRef = useRef<Map<CameraSlot, PeerConnectionInfo>>(new Map());
  const pendingIceCandidatesRef = useRef<Map<CameraSlot, RTCIceCandidateInit[]>>(new Map());
  const iceServersRef = useRef<RTCIceServer[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    iceServersRef.current = iceServers;
  }, [iceServers]);

  // Create peer connection for a camera slot
  const createPeerConnection = useCallback((slot: CameraSlot): RTCPeerConnection => {
    // Close existing connection for this slot
    const existing = peerConnectionsRef.current.get(slot);
    if (existing) {
      existing.pc.close();
    }

    // Use ref to get latest ICE servers
    const currentIceServers = iceServersRef.current.length > 0 ? iceServersRef.current : iceServers;
    console.log('Creating PeerConnection with ICE servers:', currentIceServers);
    
    const pc = new RTCPeerConnection({ iceServers: currentIceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('camera:ice', {
          matchId,
          slot,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`Received track from ${slot}:`, event.track.kind);
      
      // Get or create stream for this slot
      const stream = event.streams[0] || new MediaStream();
      
      setStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.set(slot, stream);
        return newStreams;
      });

      // Update peer connection info
      const pcInfo = peerConnectionsRef.current.get(slot);
      if (pcInfo) {
        pcInfo.stream = stream;
      }

      // Initially disable tracks if not active to save memory
      if (activeSlot !== slot) {
        stream.getTracks().forEach(track => {
          console.log(`Disabling track for inactive slot ${slot}:`, track.kind);
          track.enabled = false;
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE state for ${slot}:`, pc.iceConnectionState);
      
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        // Remove stream for this slot
        setStreams(prev => {
          const newStreams = new Map(prev);
          newStreams.delete(slot);
          return newStreams;
        });
      }
    };

    peerConnectionsRef.current.set(slot, { pc, stream: null });
    return pc;
  }, [socket, matchId, iceServers, activeSlot]);

  // Handle incoming offer from camera
  const handleOffer = useCallback(async (data: { matchId: string; slot: CameraSlot; sdp: RTCSessionDescriptionInit }) => {
    if (data.matchId !== matchId) return;

    const { slot, sdp } = data;
    console.log(`Received offer from ${slot}`);

    try {
      const pc = createPeerConnection(slot);
      
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      
      // Add any pending ICE candidates
      const pending = pendingIceCandidatesRef.current.get(slot) || [];
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn(`Error adding pending ICE candidate for ${slot}:`, err);
        }
      }
      pendingIceCandidatesRef.current.set(slot, []);

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit('camera:answer', {
        matchId,
        slot,
        sdp: pc.localDescription
      });
    } catch (err: any) {
      console.error(`Error handling offer from ${slot}:`, err);
      setError(`Failed to connect to ${slot}`);
    }
  }, [matchId, socket, createPeerConnection]);

  // Handle ICE candidate from camera
  const handleIceCandidate = useCallback(async (data: { matchId: string; slot: CameraSlot; candidate: RTCIceCandidateInit }) => {
    if (data.matchId !== matchId) return;

    const { slot, candidate } = data;
    const pcInfo = peerConnectionsRef.current.get(slot);

    if (!pcInfo || !pcInfo.pc.remoteDescription) {
      // Queue candidate for later
      const pending = pendingIceCandidatesRef.current.get(slot) || [];
      pending.push(candidate);
      pendingIceCandidatesRef.current.set(slot, pending);
      return;
    }

    try {
      await pcInfo.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn(`Error adding ICE candidate for ${slot}:`, err);
    }
  }, [matchId]);

  // Handle camera state update
  const handleCameraState = useCallback((state: CameraState) => {
    if (state.matchId !== matchId) return;

    setCameras(state.cameras);
    setActiveSlot(state.activeSlot);
    
    if (state.iceServers && state.iceServers.length > 0) {
      setIceServers(state.iceServers);
    }
  }, [matchId]);

  // Handle camera switch event
  const handleCameraSwitched = useCallback((data: { matchId: string; activeSlot: CameraSlot | null }) => {
    if (data.matchId === matchId) {
      setActiveSlot(data.activeSlot);
    }
  }, [matchId]);

  // Handle new camera source
  const handleNewSource = useCallback((data: { matchId: string; slot: CameraSlot; label: string }) => {
    if (data.matchId !== matchId) return;
    
    console.log(`New camera source: ${data.slot} (${data.label})`);
    // The camera will send an offer, we just wait for it
  }, [matchId]);

  // Handle camera left
  const handleSourceLeft = useCallback((data: { matchId: string; slot: CameraSlot }) => {
    if (data.matchId !== matchId) return;

    const { slot } = data;
    
    // Close peer connection
    const pcInfo = peerConnectionsRef.current.get(slot);
    if (pcInfo) {
      pcInfo.pc.close();
      peerConnectionsRef.current.delete(slot);
    }

    // Remove stream
    setStreams(prev => {
      const newStreams = new Map(prev);
      newStreams.delete(slot);
      return newStreams;
    });
  }, [matchId]);

  // Switch active camera
  const switchCamera = useCallback((slot: CameraSlot | null) => {
    socket?.emit('camera:switch', { matchId, slot });
  }, [socket, matchId]);

  // Request current state
  const requestState = useCallback(() => {
    socket?.emit('camera:request_state', { matchId });
  }, [socket, matchId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('camera:state', handleCameraState);
    socket.on('camera:switched', handleCameraSwitched);
    socket.on('camera:offer', handleOffer);
    socket.on('camera:ice', handleIceCandidate);
    socket.on('camera:new_source', handleNewSource);
    socket.on('camera:source_left', handleSourceLeft);

    // Handle compositor join result
    const handleJoinResult = (result: CompositorJoinResult) => {
      if (result.success) {
        setIsConnected(true);
        setIceServers(result.iceServers);
        setCameras(result.cameras);
      } else {
        setError(result.error || 'Failed to join as compositor');
      }
    };
    socket.on('camera:compositor_join_result', handleJoinResult);

    // Handle being replaced by another compositor
    const handleReplaced = () => {
      setError('Another compositor took over');
      setIsConnected(false);
    };
    socket.on('camera:compositor_replaced', handleReplaced);

    return () => {
      socket.off('camera:state', handleCameraState);
      socket.off('camera:switched', handleCameraSwitched);
      socket.off('camera:offer', handleOffer);
      socket.off('camera:ice', handleIceCandidate);
      socket.off('camera:new_source', handleNewSource);
      socket.off('camera:source_left', handleSourceLeft);
      socket.off('camera:compositor_join_result', handleJoinResult);
      socket.off('camera:compositor_replaced', handleReplaced);
    };
  }, [socket, handleCameraState, handleCameraSwitched, handleOffer, handleIceCandidate, handleNewSource, handleSourceLeft]);

  // Manage track enabled state based on activeSlot to save memory
  useEffect(() => {
    streams.forEach((stream, slot) => {
      const shouldBeEnabled = slot === activeSlot;
      stream.getTracks().forEach(track => {
        if (track.enabled !== shouldBeEnabled) {
          track.enabled = shouldBeEnabled;
          console.log(`${shouldBeEnabled ? 'Enabled' : 'Disabled'} track for slot ${slot}:`, track.kind);
        }
      });
    });
  }, [activeSlot, streams]);

  // Join as compositor when socket connects
  useEffect(() => {
    if (!socket || !matchId) return;

    const joinCompositor = () => {
      // Force leave first to clean up any stale state
      socket.emit('camera:compositor_leave', { matchId });
      setTimeout(() => {
        socket.emit('camera:compositor_join', { matchId });
      }, 1000); // Wait 1 second before joining
    };

    joinCompositor(); // Initial join

    // Retry join if failed after 5 seconds
    const retryInterval = setInterval(() => {
      if (!isConnected && !error) {
        console.log('[Compositor] Retrying join...');
        joinCompositor();
      } else if (isConnected) {
        console.log('[Compositor] Connected successfully');
        clearInterval(retryInterval);
      }
    }, 5000);

    return () => {
      clearInterval(retryInterval);
      // Cleanup peer connections
      peerConnectionsRef.current.forEach((pcInfo) => {
        pcInfo.pc.close();
      });
      peerConnectionsRef.current.clear();
      setStreams(new Map());
    };
  }, [socket, matchId, isConnected, error]);

  return {
    cameras,
    streams,
    activeSlot,
    isConnected,
    error,
    iceServers,
    switchCamera,
    requestState
  };
}
