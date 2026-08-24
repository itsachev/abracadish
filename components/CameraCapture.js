"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extractGpsFromFile } from "@/lib/exifLocation";
import { saveScanLocation } from "@/lib/scanLocation";
import { storePhoto } from "@/lib/photoStorage";
import { trackEvent } from "@/lib/trackEvent";

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

function drawScaledToCanvas(canvas, source, sourceWidth, sourceHeight) {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function CameraCapture() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [notice, setNotice] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Attach the live stream to the <video> element once it mounts (camera view).
  useEffect(() => {
    if (!cameraOpen || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video
      .play()
      .then(() => setReady(true))
      .catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [cameraOpen]);

  // Stop any open camera stream on unmount (e.g. navigating away).
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function goToResults(dataUrl, source) {
    trackEvent("photo_captured", { source });
    storePhoto(dataUrl);
    router.push("/results");
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function closeCamera() {
    stopStream();
    setCameraOpen(false);
    setReady(false);
  }

  async function openCamera() {
    setNotice(null);
    // On phones, go straight to the native camera app (no in-page preview) —
    // it's the camera UI people already know, with better quality/controls
    // than an in-browser feed. The live getUserMedia preview is reserved for
    // desktop, where there's no native camera app to hand off to.
    if (isMobileDevice() || !navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      cameraInputRef.current?.click();
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;
    const dataUrl = drawScaledToCanvas(canvas, video, video.videoWidth, video.videoHeight);
    stopStream();
    goToResults(dataUrl, "camera");
  }

  async function handleFileChosen(event, source) {
    const file = event.target.files?.[0];
    // Reset so choosing the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setProcessing(true);
    try {
      // Read EXIF GPS from the original file before createImageBitmap + canvas
      // redraw strips all metadata.
      const location = await extractGpsFromFile(file);
      saveScanLocation(location);

      const bitmap = await createImageBitmap(file);
      const dataUrl = drawScaledToCanvas(canvas, bitmap, bitmap.width, bitmap.height);
      bitmap.close?.();
      goToResults(dataUrl, source);
    } catch {
      setNotice("Couldn't read that photo. Try a different one.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden text-center">
        <button
          type="button"
          onClick={() => (cameraOpen ? closeCamera() : router.push("/"))}
          aria-label="Close camera"
          className="absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {cameraOpen ? (
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        ) : (
          <div className="flex flex-col items-center px-8">
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={openCamera}
                disabled={processing}
                aria-label="Open camera"
                className="flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/5 text-neutral-400 disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
                  <path d="M4 8a2 2 0 0 1 2-2h1.2l.8-1.6A1 1 0 0 1 8.9 4h6.2a1 1 0 0 1 .9.6L16.8 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={processing}
                aria-label="Choose from gallery"
                className="flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/5 text-neutral-400 disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m4 17 5-5 3 3 4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="mt-4 text-sm text-neutral-300">
              {processing ? "Processing photo…" : "Tap to take image or choose from gallery."}
            </p>
          </div>
        )}

        {notice && (
          <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+4rem)] z-10 rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-center text-sm text-white backdrop-blur-sm">
            {notice}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {cameraOpen && (
        <div className="flex items-center justify-center bg-black py-6">
          <button
            type="button"
            onClick={capturePhoto}
            disabled={!ready}
            aria-label="Capture photo"
            className="gradient-accent glow-accent h-16 w-16 rounded-full border-4 border-white/90 disabled:opacity-40"
          />
        </div>
      )}

      {/* Fallback for browsers without getUserMedia support, or when permission is denied. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileChosen(e, "camera")}
        className="hidden"
      />
      {/* No capture attribute here — this one opens the plain photo gallery/picker. */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChosen(e, "gallery")}
        className="hidden"
      />
    </div>
  );
}
