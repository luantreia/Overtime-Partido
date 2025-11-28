/**
 * CameraPreview - Individual camera preview component
 * 
 * Displays a video stream with status indicator and selection controls.
 * Used in the broadcast compositor to show all connected cameras.
 */

import React, { useEffect, useRef } from 'react';
import type { CameraSlot, CameraStatus } from '../../../shared/types/camera.types';

interface CameraPreviewProps {
  slot: CameraSlot;
  label: string;
  status: CameraStatus;
  stream: MediaStream | null;
  isActive: boolean;
  onClick: () => void;
}

const STATUS_CONFIG: Record<CameraStatus, { color: string; bgColor: string; text: string }> = {
  live: { color: 'text-green-400', bgColor: 'bg-green-500', text: 'En vivo' },
  connecting: { color: 'text-yellow-400', bgColor: 'bg-yellow-500', text: 'Conectando' },
  error: { color: 'text-red-400', bgColor: 'bg-red-500', text: 'Error' },
  offline: { color: 'text-gray-400', bgColor: 'bg-gray-500', text: 'Desconectado' }
};

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  slot,
  label,
  status,
  stream,
  isActive,
  onClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  const statusConfig = STATUS_CONFIG[status];

  return (
    <div
      onClick={onClick}
      className={`
        relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer
        transition-all duration-200 
        ${isActive 
          ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-gray-800 scale-[1.02]' 
          : 'ring-2 ring-gray-700 hover:ring-gray-500'
        }
      `}
    >
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* No video placeholder */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Sin señal</p>
          </div>
        </div>
      )}

      {/* Active indicator (PROGRAM) */}
      {isActive && (
        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          PROGRAM
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${statusConfig.bgColor} ${status === 'live' || status === 'connecting' ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.text}</span>
      </div>

      {/* Label bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium">{label}</span>
          <span className="text-gray-400 text-xs">{slot.toUpperCase()}</span>
        </div>
      </div>

      {/* Click overlay for better UX */}
      <div className="absolute inset-0 bg-transparent hover:bg-white/5 transition-colors" />
    </div>
  );
};

export default CameraPreview;
