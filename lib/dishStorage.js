// In-memory only, same rationale as lib/photoStorage.js: this only needs to
// survive one client-side navigation from /results to /matches within the
// same app session, which Next.js never reloads the page for.
let currentDish = null;

export function storeDish(dish) {
  currentDish = dish;
}

export function getDish() {
  return currentDish;
}

export function clearDish() {
  currentDish = null;
}
