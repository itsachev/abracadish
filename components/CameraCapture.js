"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extractGpsFromFile } from "@/lib/exifLocation";
import { saveScanLocation } from "@/lib/scanLocation";
import { storePhoto } from "@/lib/photoStorage";

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
  const canvasRef = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [notice, setNotice] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  function goToResults(dataUrl) {
    storePhoto(dataUrl);
    router.push("/results");
  }

  async function handleFileChosen(event) {
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
      goToResults(dataUrl);
    } catch {
      setNotice("Couldn't read that photo. Try a different one.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8 text-center">
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

        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/5 text-neutral-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
            <path d="M4 8a2 2 0 0 1 2-2h1.2l.8-1.6A1 1 0 0 1 8.9 4h6.2a1 1 0 0 1 .9.6L16.8 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>
        <p className="mt-4 text-sm text-neutral-300">
          {processing ? "Processing photo…" : "Take a photo of your dish, or pick one from your gallery."}
        </p>

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
          onClick={() => galleryInputRef.current?.click()}
          disabled={processing}
          className="flex flex-col items-center gap-1 text-xs text-white/70 disabled:opacity-40"
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
          onClick={() => cameraInputRef.current?.click()}
          disabled={processing}
          aria-label="Take photo"
          className="gradient-accent glow-accent h-16 w-16 rounded-full border-4 border-white/90 disabled:opacity-40"
        />

        <div className="h-11 w-11" />
      </div>

      {/* capture="environment" opens the phone's native camera app directly. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChosen}
        className="hidden"
      />
      {/* No capture attribute here — this one opens the plain photo gallery/picker. */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChosen}
        className="hidden"
      />
    </div>
  );
}
