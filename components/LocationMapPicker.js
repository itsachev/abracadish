"use client";

import { useEffect } from "react";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";

const WORLD_CENTER = { lat: 20, lng: 0 };
const WORLD_ZOOM = 2;
const PIN_ZOOM = 17;

// Custom pin so the marker matches the app's accent color instead of the
// default Google Maps red teardrop.
const PIN_ICON = {
  path: "M12 2C7.58 2 4 5.58 4 10c0 5.25 6.7 11.4 7.3 11.94a1 1 0 0 0 1.4 0C13.3 21.4 20 15.25 20 10c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
  fillColor: "#f0a430",
  fillOpacity: 1,
  strokeColor: "#2a1704",
  strokeWeight: 1,
  scale: 1.7,
  anchor: { x: 12, y: 22 },
};

// Pans/zooms to a new pin position without making the map a fully
// controlled component — that would snap the view back to `center` on
// every unrelated re-render and fight the user's own panning/zooming.
function Recenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !position) return;
    map.panTo(position);
    if (map.getZoom() < PIN_ZOOM) map.setZoom(PIN_ZOOM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, position?.lat, position?.lng]);

  return null;
}

export default function LocationMapPicker({ position, onPositionChange }) {
  function handlePick(lat, lng) {
    onPositionChange({ lat, lng, source: "map" });
  }

  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border">
      <Map
        defaultCenter={position ?? WORLD_CENTER}
        defaultZoom={position ? PIN_ZOOM : WORLD_ZOOM}
        style={{ width: "100%", height: "180px" }}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        onClick={(event) => {
          const latLng = event.detail?.latLng;
          if (latLng) handlePick(latLng.lat, latLng.lng);
        }}
      >
        {position && (
          <Marker
            position={position}
            draggable
            icon={PIN_ICON}
            onDragEnd={(event) => {
              const latLng = event.latLng;
              if (latLng) handlePick(latLng.lat(), latLng.lng());
            }}
          />
        )}
        <Recenter position={position} />
      </Map>
      <p className="bg-surface px-3 py-1.5 text-[11px] text-muted">
        Drag the pin or tap the map to fine-tune the exact spot.
      </p>
    </div>
  );
}
