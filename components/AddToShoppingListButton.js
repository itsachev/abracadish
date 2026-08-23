"use client";

import { useSyncExternalStore } from "react";
import {
  addRecipeToShoppingList,
  getShoppingListSnapshot,
  subscribeToShoppingListChanges,
} from "@/lib/shoppingList";

const EMPTY = [];

export default function AddToShoppingListButton({ recipe, className = "" }) {
  const items = useSyncExternalStore(subscribeToShoppingListChanges, getShoppingListSnapshot, () => EMPTY);

  const ingredients = recipe.ingredients ?? [];
  const alreadyAdded =
    ingredients.length > 0 &&
    ingredients.every((ingredient) =>
      items.some(
        (item) => item.recipeId === recipe.id && item.name.toLowerCase() === ingredient.name.toLowerCase()
      )
    );

  return (
    <button
      type="button"
      onClick={() => addRecipeToShoppingList(recipe)}
      disabled={alreadyAdded}
      className={`gradient-accent-soft flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/30 py-3.5 text-center text-sm font-semibold text-foreground transition-transform active:scale-[0.98] disabled:opacity-60 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8L6 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {alreadyAdded ? "In shopping list" : "Add to shopping list"}
    </button>
  );
}
