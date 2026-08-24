// Tracks whether a first-time visitor has ever tapped the bottom nav's Scan
// tab yet — drives the attention-pulse on that tab until they do.
const SEEN_KEY = "abracadish:scanNavSeen";

export function hasSeenScanNav() {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markScanNavSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // ignore
  }
}
