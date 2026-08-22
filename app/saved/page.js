"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import RecipeCard from "@/components/RecipeCard";
import { getSavedIdsSnapshot, subscribeToSavedChanges } from "@/lib/savedRecipes";
import { getRecipesByIds } from "@/lib/recipes";

const EMPTY = [];

export default function SavedPage() {
  const savedIds = useSyncExternalStore(subscribeToSavedChanges, getSavedIdsSnapshot, () => EMPTY);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getRecipesByIds(savedIds)
      .then((data) => {
        if (cancelled) return;
        const order = new Map(savedIds.map((id, i) => [id, i]));
        data.sort((a, b) => order.get(a.id) - order.get(b.id));
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
  }, [savedIds]);

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Saved recipes</h1>

      {!loading && recipes.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">
            Recipes you save will show up here.
          </p>
          <Link
            href="/scan"
            className="gradient-accent rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            Scan a dish
          </Link>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="mt-4 space-y-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
