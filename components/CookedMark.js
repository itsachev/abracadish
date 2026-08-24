"use client";

import { useSyncExternalStore } from "react";
import { isRecipeCooked, subscribeToCookedChanges } from "@/lib/cookedRecipes";

export default function CookedMark({ recipeId, className = "" }) {
  const cooked = useSyncExternalStore(
    subscribeToCookedChanges,
    () => isRecipeCooked(recipeId),
    () => false
  );

  if (!cooked) return null;
  return (
    <span
      className={`inline-flex -translate-y-0.5 items-center gap-1 rounded-full bg-accent-soft px-3 py-1 align-middle font-mono text-xs font-semibold text-accent ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
        <path
          d="M5 12.5l4.5 4.5L19 7"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Cooked
    </span>
  );
}
