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
      <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Saved recipes</h1>

      {!loadingRecipes && recipes.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">Recipes you save will show up here.</p>
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

      <h2 className="font-display text-3xl font-normal tracking-tight text-foreground mt-7">Scan history</h2>

      {user === null && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4 text-center text-sm text-muted">
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
