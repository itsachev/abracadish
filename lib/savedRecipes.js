const STORAGE_KEY = "abracadish:savedRecipes";
const CHANGE_EVENT = "abracadish:saved-changed";

function readIds() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// Cached so useSyncExternalStore gets a stable reference when nothing changed.
let cachedIds = [];

export function getSavedIdsSnapshot() {
  if (typeof window === "undefined") return cachedIds;
  const ids = readIds();
  const changed = ids.length !== cachedIds.length || ids.some((id, i) => id !== cachedIds[i]);
  if (changed) cachedIds = ids;
  return cachedIds;
}

export function isRecipeSaved(recipeId) {
  return getSavedIdsSnapshot().includes(recipeId);
}

export function toggleSavedRecipe(recipeId) {
  const current = readIds();
  const next = current.includes(recipeId)
    ? current.filter((id) => id !== recipeId)
    : [...current, recipeId];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  return next.includes(recipeId);
}

export function subscribeToSavedChanges(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
