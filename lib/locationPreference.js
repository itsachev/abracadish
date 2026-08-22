const DECLINED_KEY = "abracadish:locationDeclined";

export function hasDeclinedLocation() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DECLINED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLocationDeclined() {
  try {
    localStorage.setItem(DECLINED_KEY, "1");
  } catch {
    // ignore — worst case we ask again next time
  }
}
