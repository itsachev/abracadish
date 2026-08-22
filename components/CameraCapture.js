"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extractGpsFromFile } from "@/lib/exifLocation";
import { saveScanLocation } from "@/lib/scanLocation";

const PHOTO_KEY = "abracadish:lastPhoto";
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

function drawScaledToCanvas(canvas, source, sourceWidth, sourceHeight) {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  canvas.width = Math.round(sourceWidth * scale);
  canvas.height = Math.round(sourceHeight * scale);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export default function CameraCapture() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access isn't supported in this browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch {
        setCameraError("Camera access was denied or unavailable. You can upload a photo instead.");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  function goToResults(dataUrl) {
    try {
      sessionStorage.setItem(PHOTO_KEY, dataUrl);
    } catch {
      setNotice("That photo was too large to use. Try again or pick a smaller image.");
      return;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    router.push("/results");
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    // A live camera frame drawn to canvas never carries EXIF, unlike a gallery upload.
    saveScanLocation(null);
    goToResults(drawScaledToCanvas(canvas, video, video.videoWidth, video.videoHeight));
  }

  async function handleFileChosen(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      // Read EXIF GPS from the original file before createImageBitmap + canvas
      // redraw strips all metadata.
      const location = await extractGpsFromFile(file);
      saveScanLocation(location);

      const bitmap = await createImageBitmap(file);
      const dataUrl = drawScaledToCanvas(canvas, bitmap, bitmap.width, bitmap.height);
      bitmap.close?.();
      goToResults(dataUrl);
    } catch {
      setNotice("Couldn't read that photo. Try a different one.");
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Close camera"
          className="absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {!cameraError ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-neutral-300">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-neutral-500">
              <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <p className="text-sm">{cameraError}</p>
          </div>
        )}
        {notice && (
          <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+4rem)] z-10 rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-center text-sm text-white backdrop-blur-sm">
            {notice}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex items-center justify-center gap-8 bg-black py-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-xs text-white/70"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/5">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="m4 17 5-5 3 3 4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Gallery
        </button>

        <button
          type="button"
          onClick={capturePhoto}
          disabled={!ready}
          aria-label="Capture photo"
          className="gradient-accent glow-accent h-16 w-16 rounded-full border-4 border-white/90 disabled:opacity-40"
        />

        <div className="h-11 w-11" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChosen}
        className="hidden"
      />
    </div>
  );
}
