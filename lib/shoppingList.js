const STORAGE_KEY = "abracadish:shoppingList";
const CHANGE_EVENT = "abracadish:shopping-list-changed";
const ADDED_EVENT = "abracadish:shopping-list-added";

function readItems() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeItems(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function makeId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Cached so useSyncExternalStore gets a stable reference when nothing changed.
let cachedRaw = null;
let cachedItems = [];

export function getShoppingListSnapshot() {
  if (typeof window === "undefined") return cachedItems;
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedItems = JSON.parse(raw);
    } catch {
      cachedItems = [];
    }
  }
  return cachedItems;
}

export function subscribeToShoppingListChanges(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Fires only when new items land on the list (not on toggle/remove/clear),
// so the bottom nav can flag the List tab without reacting to every edit.
export function subscribeToShoppingListAdditions(callback) {
  window.addEventListener(ADDED_EVENT, callback);
  return () => window.removeEventListener(ADDED_EVENT, callback);
}

// Adds every ingredient from a recipe that isn't already on the list under
// that same recipe, so tapping "Add to list" twice doesn't duplicate rows.
export function addRecipeToShoppingList(recipe) {
  const current = readItems();
  const existingNames = new Set(
    current.filter((item) => item.recipeId === recipe.id).map((item) => item.name.toLowerCase())
  );
  const additions = (recipe.ingredients ?? [])
    .filter((ingredient) => !existingNames.has(ingredient.name.toLowerCase()))
    .map((ingredient) => ({
      id: makeId(),
      name: ingredient.name,
      quantity: ingredient.quantity ?? "",
      unit: ingredient.unit ?? "",
      checked: false,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
    }));
  if (additions.length > 0) {
    writeItems([...current, ...additions]);
    window.dispatchEvent(new CustomEvent(ADDED_EVENT));
  }
  return additions.length;
}

export function toggleShoppingItem(id) {
  writeItems(readItems().map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
}

export function removeShoppingItem(id) {
  writeItems(readItems().filter((item) => item.id !== id));
}

export function clearCheckedItems() {
  writeItems(readItems().filter((item) => !item.checked));
}

export function clearAllItems() {
  writeItems([]);
}
