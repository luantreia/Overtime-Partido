/**
 * Camera System Types
 * Types for the multi-camera WebRTC system
 */

export type CameraSlot = 'cam1' | 'cam2' | 'cam3' | 'cam4';
export type CameraStatus = 'connecting' | 'live' | 'error' | 'offline';
export type VideoQuality = 'low' | 'medium' | 'high';

export interface CameraInfo {
  slot: CameraSlot;
  label: string;
  status: CameraStatus;
  quality: VideoQuality;
}

export interface CameraState {
  matchId: string;
  cameras: CameraInfo[];
  activeSlot: CameraSlot | null;
  hasCompositor: boolean;
  iceServers: RTCIceServer[];
}

export interface VideoPreset {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}

export const VIDEO_PRESETS: Record<VideoQuality, VideoPreset> = {
  low: { width: 640, height: 360, frameRate: 24, bitrate: 800000 },
  medium: { width: 1280, height: 720, frameRate: 30, bitrate: 2500000 },
  high: { width: 1920, height: 1080, frameRate: 30, bitrate: 5000000 }
};

export const CAMERA_SLOTS: CameraSlot[] = ['cam1', 'cam2', 'cam3', 'cam4'];

// Socket event payloads
export interface CameraJoinPayload {
  matchId: string;
  slot: CameraSlot;
  label?: string;
}

export interface CameraOfferPayload {
  matchId: string;
  slot: CameraSlot;
  sdp: RTCSessionDescriptionInit;
}

export interface CameraAnswerPayload {
  matchId: string;
  slot: CameraSlot;
  sdp: RTCSessionDescriptionInit;
}

export interface CameraIcePayload {
  matchId: string;
  slot: CameraSlot;
  candidate: RTCIceCandidateInit;
}

export interface CameraSwitchPayload {
  matchId: string;
  slot: CameraSlot | null;
}

export interface CameraJoinResult {
  success: boolean;
  error?: string;
}

export interface CompositorJoinResult {
  success: boolean;
  iceServers: RTCIceServer[];
  cameras: CameraInfo[];
  error?: string;
}
