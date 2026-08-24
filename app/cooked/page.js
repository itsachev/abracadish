"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import RecipeCard from "@/components/RecipeCard";
import { getCookedIdsSnapshot, subscribeToCookedChanges } from "@/lib/cookedRecipes";
import { getSavedIdsSnapshot, subscribeToSavedChanges } from "@/lib/savedRecipes";
import { getRecipesByIds } from "@/lib/recipes";

const EMPTY = [];

export default function CookedRecipesPage() {
  const cookedIds = useSyncExternalStore(subscribeToCookedChanges, getCookedIdsSnapshot, () => EMPTY);
  const savedIds = useSyncExternalStore(subscribeToSavedChanges, getSavedIdsSnapshot, () => EMPTY);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getRecipesByIds(cookedIds)
      .then((data) => {
        if (cancelled) return;
        const order = new Map(cookedIds.map((id, i) => [id, i]));
        data.sort((a, b) => order.get(b.id) - order.get(a.id));
        setRecipes(data);
      })
      .catch(() => {
        if (!cancelled) setRecipes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cookedIds]);

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Cooked recipes</h1>

      {!loading && recipes.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">Recipes you finish cooking will show up here.</p>

          {savedIds.length > 0 ? (
            <>
              <Link
                href="/saved"
                className="gradient-accent glow-accent flex w-full max-w-xs items-center justify-center gap-1.5 rounded-3xl py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M6 4h12v16l-6-4-6 4V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                View saved recipes
              </Link>

              <div className="flex w-full max-w-xs items-center gap-3 py-1">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium uppercase tracking-wide text-muted">Or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Link
                href="/scan"
                className="flex w-full max-w-xs items-center justify-center gap-1.5 rounded-3xl border border-border py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-surface-hover"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="2" />
                </svg>
                Scan a dish
              </Link>
            </>
          ) : (
            <Link
              href="/scan"
              className="gradient-accent glow-accent flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="2" />
              </svg>
              Scan a dish
            </Link>
          )}
        </div>
      )}

      {recipes.length > 0 && (
        <div className="mt-4 space-y-3 pb-10">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} showRemove={false} />
          ))}
        </div>
      )}
    </div>
  );
}
