const LOCATION_KEY = "abracadish:lastLocation";

export function saveScanLocation(location) {
  try {
    if (location) sessionStorage.setItem(LOCATION_KEY, JSON.stringify(location));
    else sessionStorage.removeItem(LOCATION_KEY);
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — location is best-effort.
  }
}

// Cached so useSyncExternalStore gets a stable reference when the underlying
// raw string hasn't changed — JSON.parse would otherwise return a new object
// on every call and trigger an infinite re-render loop.
let cachedRaw;
let cachedLocation = null;

export function readScanLocation() {
  if (typeof window === "undefined") return null;

  let raw;
  try {
    raw = sessionStorage.getItem(LOCATION_KEY);
  } catch {
    return null;
  }

  if (raw === cachedRaw) return cachedLocation;
  cachedRaw = raw;
  try {
    cachedLocation = raw ? JSON.parse(raw) : null;
  } catch {
    cachedLocation = null;
  }
  return cachedLocation;
}
