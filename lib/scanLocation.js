const LOCATION_KEY = "abracadish:lastLocation";

export function saveScanLocation(location) {
  try {
    if (location) sessionStorage.setItem(LOCATION_KEY, JSON.stringify(location));
    else sessionStorage.removeItem(LOCATION_KEY);
  } catch {
    // sessionStorage unavailable (private browsing, etc.) — location is best-effort.
  }
}

export function readScanLocation() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
