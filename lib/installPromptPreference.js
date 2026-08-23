const DISMISSED_KEY = "abracadish:installPromptDismissed";

export function hasDismissedInstallPrompt() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissInstallPrompt() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // ignore — worst case the banner shows again next time
  }
}
