"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, X } from "lucide-react";
import { motion } from "framer-motion";

interface CameraCaptureModalProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export default function CameraCaptureModal({ onCapture, onClose }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Failed to access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Mirror horizontally so the saved image matches the selfie orientation
      // (front cameras display mirrored — we capture mirrored to stay consistent
      // with how the attendance photo is also captured in MarkAttendanceClient)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();
      const base64 = canvas.toDataURL("image/jpeg", 0.9);
      stopCamera();
      onCapture(base64);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl overflow-hidden w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h3 className="font-bold text-text-primary text-lg">Take Photo</h3>
          <button onClick={() => { stopCamera(); onClose(); }} className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 bg-neutral-900 aspect-[4/3] relative flex items-center justify-center">
          {error ? (
            <div className="text-danger-400 text-sm text-center px-4">{error}</div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                // Mirror visually so user sees natural selfie view
                style={{ transform: "scaleX(-1)" }}
                className="w-full h-full object-cover rounded-xl"
              />
              {/* Face Guide Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-56 border-4 border-white/40 rounded-[40%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 flex justify-center bg-neutral-50 border-t border-border">
          <button
            onClick={capture}
            disabled={!!error}
            className="btn-primary w-full max-w-[200px] flex justify-center gap-2 py-2.5"
          >
            <Camera className="w-5 h-5" />
            Capture Photo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
