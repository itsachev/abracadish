"use client";

import { useState, useSyncExternalStore } from "react";
import { readScanLocation, saveScanLocation } from "@/lib/scanLocation";
import { hasDeclinedLocation, setLocationDeclined } from "@/lib/locationPreference";

function subscribeNoop() {
  return () => {};
}

function getServerSnapshotNull() {
  return null;
}

function getServerSnapshotFalse() {
  return false;
}

export default function LocationPrompt({ restaurantName, onRestaurantNameChange }) {
  // useSyncExternalStore, not useState(() => ...) — reading storage in a
  // lazy initializer would mismatch the server's null render (see the
  // /results hydration fix).
  const storedLocation = useSyncExternalStore(subscribeNoop, readScanLocation, getServerSnapshotNull);
  const declined = useSyncExternalStore(subscribeNoop, hasDeclinedLocation, getServerSnapshotFalse);
  const [addedLocation, setAddedLocation] = useState(null);
  const [requesting, setRequesting] = useState(false);

  const location = storedLocation ?? addedLocation;

  function requestLocation() {
    if (!navigator.geolocation) return;
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRequesting(false);
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: "geolocation",
        };
        saveScanLocation(next);
        setAddedLocation(next);
      },
      (error) => {
        setRequesting(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationDeclined();
        }
      },
      { timeout: 8000 }
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-4 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-foreground">Where did you have this?</h2>
      <p className="text-xs text-muted">Optional — helps with restaurant matching later.</p>

      <input
        type="text"
        value={restaurantName}
        onChange={(event) => onRestaurantNameChange(event.target.value)}
        placeholder="Restaurant name (optional)"
        className="mt-3 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none"
      />

      {location ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M8 12.5l2.5 2.5L16 9.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Location {location.source === "exif" ? "detected from photo" : "added"}
        </p>
      ) : (
        !declined && (
          <button
            type="button"
            onClick={requestLocation}
            disabled={requesting}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path
                d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            {requesting ? "Getting location…" : "Add location"}
          </button>
        )
      )}
    </section>
  );
}
