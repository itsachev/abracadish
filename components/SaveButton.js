"use client";

import { useSyncExternalStore } from "react";
import { isRecipeSaved, subscribeToSavedChanges, toggleSavedRecipe } from "@/lib/savedRecipes";

export default function SaveButton({ recipeId, className = "" }) {
  const saved = useSyncExternalStore(
    subscribeToSavedChanges,
    () => isRecipeSaved(recipeId),
    () => false
  );

  return (
    <button
      type="button"
      onClick={() => toggleSavedRecipe(recipeId)}
      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        saved
          ? "border-accent/50 bg-accent-soft text-accent"
          : "border-border text-muted hover:text-foreground"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} className="h-4 w-4">
        <path d="M6 4h12v16l-6-4-6 4V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
