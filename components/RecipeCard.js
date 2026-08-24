"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MatchBadge from "@/components/MatchBadge";
import { toggleSavedRecipe } from "@/lib/savedRecipes";

// matchScore/matchReasons are ephemeral, query-time results (from
// /api/match-recipes) — not stored on the recipe row — so we carry them
// through the URL to the detail page rather than re-querying there.
export default function RecipeCard({ recipe }) {
  const cardRef = useRef(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  const hasScore = typeof recipe.matchScore === "number";
  const params = new URLSearchParams();
  if (hasScore) params.set("score", recipe.matchScore.toFixed(3));
  if (recipe.matchReasons?.length) params.set("reasons", recipe.matchReasons.join("|"));
  const query = params.toString();

  return (
    <div
      ref={cardRef}
      className="group relative rounded-3xl border border-border bg-surface p-4 backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-surface-hover"
    >
      <Link
        href={`/recipe/${recipe.id}${query ? `?${query}` : ""}`}
        className="absolute inset-0 rounded-3xl"
        aria-label={recipe.title}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">{recipe.title}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {recipe.cuisine} · {recipe.protein}
          </p>
        </div>

        {confirming ? (
          <div className="relative z-10 flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => toggleSavedRecipe(recipe.id)}
              className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-start gap-2">
            {hasScore && (
              <div className="text-right">
                <div className="gradient-text font-mono text-lg font-bold">
                  {Math.round(recipe.matchScore * 100)}%
                </div>
                <div className="text-xs text-muted">match</div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Remove saved recipe"
              className="relative z-10 rounded-full p-1.5 text-red-600 transition-colors hover:bg-red-400/10"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.7 12.1A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.9L7 7"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="mt-3">
        <MatchBadge matchType={recipe.matchType} />
      </div>
    </div>
  );
}
