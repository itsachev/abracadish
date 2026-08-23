const SEEN_KEY = "abracadish:onboarded";

export function hasSeenOnboarding() {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // ignore — worst case the welcome screen shows again next time
  }
}
