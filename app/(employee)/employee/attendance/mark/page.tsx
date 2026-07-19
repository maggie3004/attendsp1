"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, MapPin, CheckCircle2, XCircle, ArrowLeft,
  RefreshCw, Scan, Navigation, Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Step = "camera" | "capture" | "location" | "processing" | "success" | "error";

export default function MarkAttendancePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraError, setcameraError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const startCamera = useCallback(async () => {
    setcameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setcameraError("Your browser does not support camera access (HTTPS is required).");
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setStep("capture");
    } catch (err: unknown) {
      console.error("Camera error:", err);
      const errorMessage = err instanceof Error ? err.message : "Camera access denied.";
      setcameraError(errorMessage || "Camera access denied. Please allow camera access to mark attendance.");
    }
  }, []);

  // Step 2: Capture Face
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageData);

    // Stop the stream
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setStep("location");
  }, []);

  // Step 3: Get Location
  const getLocation = useCallback(() => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        submitAttendance(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocationError("Location access denied. Please enable location to proceed.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
    setStep("processing");
  }, [capturedImage]);

  // Step 4: Submit
  const submitAttendance = async (lat: number, lng: number) => {
    try {
      // Upload face image
      let imageUrl: string | null = null;
      if (capturedImage) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: capturedImage, folder: "attendance" }),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) imageUrl = uploadData.data.url;
      }

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInImage: imageUrl,
          checkInLat: lat,
          checkInLng: lng,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStep("success");
      } else {
        setErrorMessage(data.error ?? "Failed to mark attendance");
        setStep("error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStep("error");
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setStep("camera");
    startCamera();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pt-6">
        <button
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            router.back();
          }}
          className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary font-display">Mark Attendance</h1>
      </div>

      {/* Progress Steps */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2">
          {["Camera", "Face", "Location", "Done"].map((s, i) => {
            const stepIndex = { camera: 0, capture: 1, location: 2, processing: 2, success: 3, error: 3 }[step];
            const isComplete = i < stepIndex;
            const isActive = i === stepIndex;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isComplete ? "bg-success-500 text-white" : isActive ? "bg-primary text-white" : "bg-neutral-200 text-neutral-400"
                }`}>
                  {isComplete ? "✓" : i + 1}
                </div>
                <span className={`text-xs ${isActive ? "text-text-primary font-medium" : "text-text-muted"}`}>{s}</span>
                {i < 3 && <div className={`flex-1 h-0.5 rounded ${isComplete ? "bg-success-500" : "bg-neutral-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {/* Step: Allow Camera */}
          {step === "camera" && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-8 space-y-6"
            >
              <div className="w-24 h-24 bg-primary-50 rounded-3xl flex items-center justify-center">
                <Camera className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-text-primary mb-2">Allow Camera Access</h2>
                <p className="text-text-secondary text-sm max-w-xs">
                  We need camera access to capture your face for attendance verification.
                </p>
              </div>
              {cameraError && (
                <div className="w-full p-3 bg-danger-50 border border-danger-200 rounded-xl">
                  <p className="text-sm text-danger-700 text-center">{cameraError}</p>
                </div>
              )}
              <button onClick={startCamera} className="mobile-btn-primary max-w-xs">
                <Camera className="w-5 h-5" />
                Open Camera
              </button>
            </motion.div>
          )}

          {/* Step: Capture */}
          {step === "capture" && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div className="relative rounded-3xl overflow-hidden bg-neutral-900 aspect-[4/3]">
                <video
                  ref={(node) => {
                    if (node && streamRef.current) {
                      node.srcObject = streamRef.current;
                    }
                    videoRef.current = node;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-56 border-4 border-white/60 rounded-full" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-sm rounded-xl px-3 py-2">
                  <p className="text-white text-xs text-center flex items-center justify-center gap-1.5">
                    <Scan className="w-3.5 h-3.5" />
                    Position your face in the circle
                  </p>
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <button onClick={captureImage} className="mobile-btn-primary">
                <Camera className="w-5 h-5" />
                Capture Photo
              </button>
            </motion.div>
          )}

          {/* Step: Location */}
          {step === "location" && (
            <motion.div
              key="location"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Preview captured image */}
              {capturedImage && (
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-success-500 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Photo Captured
                  </div>
                  <button
                    onClick={retake}
                    className="absolute bottom-3 left-3 bg-white/90 text-text-primary text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retake
                  </button>
                </div>
              )}

              <div className="mobile-card text-center space-y-3">
                <div className="w-16 h-16 bg-info-50 rounded-2xl flex items-center justify-center mx-auto">
                  <Navigation className="w-8 h-8 text-info-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Verify Location</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Allow location access to verify you're at your assigned site.
                  </p>
                </div>
                {locationError && (
                  <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-xl p-3">
                    {locationError}
                  </p>
                )}
              </div>

              <button onClick={getLocation} className="mobile-btn-primary">
                <MapPin className="w-5 h-5" />
                Allow Location & Submit
              </button>
            </motion.div>
          )}

          {/* Step: Processing */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 space-y-6"
            >
              <div className="relative">
                <div className="w-24 h-24 bg-primary-50 rounded-3xl flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-text-primary">Processing...</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Uploading and recording your attendance
                </p>
              </div>
              <div className="space-y-2 w-full max-w-xs">
                {["Uploading face image...", "Verifying location...", "Recording attendance..."].map((msg, i) => (
                  <motion.div
                    key={msg}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                    className="flex items-center gap-2.5 text-sm text-text-secondary"
                  >
                    <div className="w-4 h-4 bg-primary-100 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    </div>
                    {msg}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-28 h-28 bg-success-50 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-16 h-16 text-success-500" />
              </motion.div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-text-primary font-display">
                  Attendance Marked! 🎉
                </h2>
                <p className="text-text-secondary text-sm mt-2">
                  Your attendance has been successfully recorded.
                </p>
              </div>
              <div className="mobile-card w-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Date</span>
                  <span className="text-sm font-medium text-text-primary">
                    {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Check-in Time</span>
                  <span className="text-sm font-medium text-text-primary">
                    {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Status</span>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200">
                    ✓ Present
                  </span>
                </div>
              </div>
              <button
                onClick={() => { window.location.href = "/employee/dashboard"; }}
                className="mobile-btn-primary"
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}

          {/* Step: Error */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-6"
            >
              <div className="w-24 h-24 bg-danger-50 rounded-full flex items-center justify-center">
                <XCircle className="w-14 h-14 text-danger-500" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-text-primary">Failed to Mark</h2>
                <p className="text-text-secondary text-sm mt-2 max-w-xs">{errorMessage}</p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button onClick={() => setStep("camera")} className="mobile-btn-primary">
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                <button
                  onClick={() => { window.location.href = "/employee/dashboard"; }}
                  className="w-full h-12 bg-white text-text-secondary border border-border rounded-2xl font-medium text-sm"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
