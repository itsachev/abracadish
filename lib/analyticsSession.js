const SESSION_KEY = "abracadish:analyticsSessionId";

// A random id identifying this browser across visits, so funnel events from
// a signed-out user can still be strung together into one session. Not tied
// to auth — `trackEvent` attaches the real user id separately once signed in.
export function getAnalyticsSessionId() {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}
