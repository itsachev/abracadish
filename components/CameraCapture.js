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
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black">
      {/* Ambient brand glow behind the idle state — hidden once the live
          video covers it, but gives the pure-black camera screen some of
          the same warm depth as the rest of the app instead of a flat void. */}
      {!cameraOpen && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[38%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[110px]"
          style={{
            backgroundImage: "radial-gradient(closest-side, var(--accent), var(--accent-2), transparent)",
          }}
        />
      )}

      {/* Top scrim so the close button always reads clearly, over video or void alike. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-black/60 to-transparent"
      />

      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden text-center">
        <button
          type="button"
          onClick={() => (cameraOpen ? closeCamera() : router.push("/"))}
          aria-label="Close camera"
          className="absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md transition-transform active:scale-90"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {cameraOpen ? (
          <>
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

            {/* Vignette: darkens everything outside the framing square so the
                subject area reads as the clear focal point. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 42% at 50% 46%, transparent 55%, rgba(0,0,0,0.55) 100%)",
              }}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[46%] aspect-square w-[78%] max-w-xs -translate-x-1/2 -translate-y-1/2"
            >
              <span className="absolute left-0 top-0 h-9 w-9 rounded-tl-2xl border-l-[3px] border-t-[3px] border-accent [filter:drop-shadow(0_0_6px_rgba(240,164,48,0.6))]" />
              <span className="absolute right-0 top-0 h-9 w-9 rounded-tr-2xl border-r-[3px] border-t-[3px] border-accent [filter:drop-shadow(0_0_6px_rgba(240,164,48,0.6))]" />
              <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-2xl border-b-[3px] border-l-[3px] border-accent [filter:drop-shadow(0_0_6px_rgba(240,164,48,0.6))]" />
              <span className="absolute bottom-0 right-0 h-9 w-9 rounded-br-2xl border-b-[3px] border-r-[3px] border-accent [filter:drop-shadow(0_0_6px_rgba(240,164,48,0.6))]" />
            </div>

            <p className="absolute top-[calc(env(safe-area-inset-top)+4.25rem)] left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
              Center the dish in frame
            </p>
          </>
        ) : (
          <div className="animate-rise-in flex flex-col items-center px-8">
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              Scan
            </span>
            <h1 className="mt-3 font-display text-[28px] font-bold leading-tight text-white">
              What&apos;s on your <span className="gradient-text">plate?</span>
            </h1>
            <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-neutral-400">
              Point your camera at any dish, or pick one from your gallery.
            </p>

            <div className="mt-10 flex flex-col items-center gap-6">
              <div className="relative flex flex-col items-center gap-2.5">
                <span className="animate-pulse-ring absolute top-0 h-28 w-28 rounded-full border-2 border-accent" />
                <button
                  type="button"
                  onClick={openCamera}
                  disabled={processing}
                  aria-label="Open camera"
                  className="gradient-accent glow-accent relative flex h-28 w-28 items-center justify-center rounded-full text-white transition-transform active:scale-95 disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-11 w-11">
                    <path d="M4 8a2 2 0 0 1 2-2h1.2l.8-1.6A1 1 0 0 1 8.9 4h6.2a1 1 0 0 1 .9.6L16.8 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </button>
                <span className="text-xs font-semibold tracking-wide text-white">Open camera</span>
              </div>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={processing}
                aria-label="Choose from gallery"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-5 py-2.5 text-sm font-medium text-neutral-300 backdrop-blur-md transition-transform active:scale-95 disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m4 17 5-5 3 3 4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Choose from gallery
              </button>
            </div>

            {processing && (
              <div className="mt-7 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300 backdrop-blur-md">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                Processing photo…
              </div>
            )}
          </div>
        )}

        {notice && (
          <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+4rem)] z-20 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-left text-sm text-white backdrop-blur-md">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-accent">
              <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7.5v5.5M12 16.2v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {notice}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {cameraOpen && (
        <div className="relative flex flex-col items-center gap-2 bg-gradient-to-t from-black via-black/95 to-transparent pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-8">
          <button
            type="button"
            onClick={capturePhoto}
            disabled={!ready}
            aria-label="Capture photo"
            className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white/90 transition-transform active:scale-90 disabled:opacity-40"
          >
            <span className="gradient-accent glow-accent h-16 w-16 rounded-full" />
          </button>
          <span className="text-xs font-medium text-neutral-400">
            {ready ? "Tap to capture" : "Starting camera…"}
          </span>
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
