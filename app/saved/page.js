"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import RecipeCard from "@/components/RecipeCard";
import ScanCard from "@/components/ScanCard";
import { getSavedIdsSnapshot, subscribeToSavedChanges } from "@/lib/savedRecipes";
import { getRecipesByIds } from "@/lib/recipes";
import { getScansForUser, deleteScan } from "@/lib/scans";
import { useAuthUser } from "@/lib/useAuthUser";

const EMPTY = [];

export default function SavedPage() {
  const user = useAuthUser();
  const savedIds = useSyncExternalStore(subscribeToSavedChanges, getSavedIdsSnapshot, () => EMPTY);
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [scans, setScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(true);

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
        if (!cancelled) setLoadingRecipes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [savedIds]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getScansForUser(user.id)
      .then((data) => {
        if (!cancelled) setScans(data);
      })
      .catch(() => {
        if (!cancelled) setScans([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingScans(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleDeleteScan(id) {
    await deleteScan(id);
    setScans((prev) => prev.filter((scan) => scan.id !== id));
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Saved recipes</h1>

      {!loadingRecipes && recipes.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">Recipes you save will show up here.</p>
          <Link
            href="/scan"
            className="gradient-accent flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="2" />
            </svg>
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

      <h2 className="font-display text-3xl font-bold tracking-tight text-foreground mt-7">Scan history</h2>

      {user === null && (
        <div className="mt-4 rounded-3xl border border-border bg-surface p-4 text-center text-sm text-muted">
          <Link href="/login" className="text-accent underline">
            Sign in
          </Link>{" "}
          to save and revisit your scan history.
        </div>
      )}

      {user && !loadingScans && scans.length === 0 && (
        <p className="mt-4 text-sm text-muted">Scans you save will show up here.</p>
      )}

      {user && scans.length > 0 && (
        <div className="mt-4 space-y-3">
          {scans.map((scan) => (
            <ScanCard key={scan.id} scan={scan} onDelete={handleDeleteScan} />
          ))}
        </div>
      )}
    </div>
  );
}
