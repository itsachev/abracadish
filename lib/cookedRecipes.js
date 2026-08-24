const STORAGE_KEY = "abracadish:cookedRecipes";
const CHANGE_EVENT = "abracadish:cooked-changed";

function readIds() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// Cached so useSyncExternalStore gets a stable reference when nothing changed.
let cachedIds = [];

export function getCookedIdsSnapshot() {
  if (typeof window === "undefined") return cachedIds;
  const ids = readIds();
  const changed = ids.length !== cachedIds.length || ids.some((id, i) => id !== cachedIds[i]);
  if (changed) cachedIds = ids;
  return cachedIds;
}

export function isRecipeCooked(recipeId) {
  return getCookedIdsSnapshot().includes(recipeId);
}

export function markRecipeCooked(recipeId) {
  const current = readIds();
  if (current.includes(recipeId)) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, recipeId]));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeToCookedChanges(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
