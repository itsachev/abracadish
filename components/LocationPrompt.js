"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { readScanLocation, saveScanLocation } from "@/lib/scanLocation";
import { hasDeclinedLocation, setLocationDeclined } from "@/lib/locationPreference";
import { getRestaurantScanStats } from "@/lib/scans";
import RestaurantSearchInput from "@/components/RestaurantSearchInput";
import LocationMapPicker from "@/components/LocationMapPicker";

const RESTAURANT_LOOKUP_DEBOUNCE_MS = 600;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const RESTAURANT_INPUT_CLASSNAME =
  "mt-3 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent/50 focus:outline-none";

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
  const content = (
    <LocationPromptContent restaurantName={restaurantName} onRestaurantNameChange={onRestaurantNameChange} />
  );

  if (!GOOGLE_MAPS_API_KEY) return content;

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      {content}
    </APIProvider>
  );
}

function LocationPromptContent({ restaurantName, onRestaurantNameChange }) {
  // useSyncExternalStore, not useState(() => ...) — reading storage in a
  // lazy initializer would mismatch the server's null render (see the
  // /results hydration fix).
  const storedLocation = useSyncExternalStore(subscribeNoop, readScanLocation, getServerSnapshotNull);
  const declined = useSyncExternalStore(subscribeNoop, hasDeclinedLocation, getServerSnapshotFalse);
  const [addedLocation, setAddedLocation] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [restaurantStats, setRestaurantStats] = useState(null);

  const location = storedLocation ?? addedLocation;

  // Debounced lookup: "N people have scanned dishes here" social proof,
  // keyed on the restaurant name specifically (not the coarser city-level
  // location label — that would produce misleading matches across unrelated
  // restaurants, which conflicts with the app's honesty-about-uncertainty
  // principle). Only fires once someone's typed something that looks like a
  // real name, not on every keystroke.
  useEffect(() => {
    const trimmed = restaurantName?.trim();
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;
      if (!trimmed || trimmed.length < 3) {
        setRestaurantStats(null);
        return;
      }
      getRestaurantScanStats(trimmed)
        .then((stats) => {
          if (!cancelled) setRestaurantStats(stats);
        })
        .catch(() => {
          if (!cancelled) setRestaurantStats(null);
        });
    }, RESTAURANT_LOOKUP_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [restaurantName]);

  // Resolve a human-readable place name once we have coordinates. Guarded on
  // location.label so this only fires once per location: saving the label
  // back into scanLocation changes the stored raw string, which produces a
  // new `location` object on the next render — but that one already has
  // `label` set, so the effect no-ops instead of re-fetching forever.
  useEffect(() => {
    if (!location || location.label) return;
    let cancelled = false;

    fetch("/api/reverse-geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: location.lat, lng: location.lng }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.label) return;
        const next = { ...location, label: data.label };
        saveScanLocation(next);
        setAddedLocation(next);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [location]);

  // A place picked from search is the most precise signal we can get, so it
  // takes over the pin outright — including clearing any previous label, so
  // the reverse-geocode effect re-resolves it for the new spot.
  function handlePlaceSelect(place) {
    const next = { lat: place.lat, lng: place.lng, source: "places", placeId: place.placeId };
    saveScanLocation(next);
    setAddedLocation(next);
  }

  function handleMapPositionChange(next) {
    saveScanLocation(next);
    setAddedLocation(next);
  }

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
    <section className="mt-6 rounded-3xl border border-border bg-surface p-4 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-foreground">Where did you have this?</h2>
      <p className="text-xs text-muted">Optional — helps with restaurant matching later.</p>

      {GOOGLE_MAPS_API_KEY ? (
        <div className="mt-3">
          <RestaurantSearchInput
            value={restaurantName}
            onChange={onRestaurantNameChange}
            onPlaceSelect={handlePlaceSelect}
            className={RESTAURANT_INPUT_CLASSNAME}
          />
        </div>
      ) : (
        <input
          type="text"
          value={restaurantName}
          onChange={(event) => onRestaurantNameChange(event.target.value)}
          placeholder="Restaurant name (optional)"
          className={RESTAURANT_INPUT_CLASSNAME}
        />
      )}

      {restaurantStats &&
        (restaurantStats.totalCount > 0 ? (
          <p className="mt-2 text-xs text-accent">
            🍽️ {restaurantStats.totalCount} scan{restaurantStats.totalCount === 1 ? "" : "s"} logged
            here
            {restaurantStats.sampleDishes.length > 0 &&
              ` — including ${restaurantStats.sampleDishes.slice(0, 2).join(", ")}`}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted">You&apos;ll be the first to scan a dish here 🎉</p>
        ))}

      {location ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
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
          {location.label ??
            (location.source === "exif" ? "Location detected from photo" : "Location added")}
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

      {GOOGLE_MAPS_API_KEY && (location || !declined) && (
        <LocationMapPicker
          position={location ? { lat: location.lat, lng: location.lng } : null}
          onPositionChange={handleMapPositionChange}
        />
      )}
    </section>
  );
}
