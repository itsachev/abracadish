"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MatchBadge from "@/components/MatchBadge";
import { findRecipeCandidates, generateRecipeForDish } from "@/lib/cookScan";
import { getDish } from "@/lib/dishStorage";
import { trackEvent } from "@/lib/trackEvent";

function subscribeNoop() {
  return () => {};
}

function getDishServerSnapshot() {
  return null;
}

export default function MatchesPage() {
  const router = useRouter();
  // Same hydration-safe pattern as /results' photo read: server and the
  // client's first render both see null, so there's no mismatch.
  const dish = useSyncExternalStore(subscribeNoop, getDish, getDishServerSnapshot);
  const [candidates, setCandidates] = useState(null);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!dish) {
      router.replace("/scan");
      return;
    }

    let cancelled = false;

    findRecipeCandidates(dish)
      .then((matches) => {
        if (cancelled) return;
        trackEvent("matches_viewed", { dishName: dish.name, count: matches.length });
        if (matches.length === 0) {
          return generateRecipeForDish(dish).then((id) => {
            if (cancelled) return;
            trackEvent("recipe_selected", {
              dishName: dish.name,
              recipeId: id,
              source: "ai-generated",
              auto: true,
            });
            router.replace(`/recipe/${id}`);
          });
        }
        setCandidates(matches);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Couldn't find a recipe.");
      });

    return () => {
      cancelled = true;
    };
  }, [dish, router]);

  async function handleGenerateInstead() {
    setGenerating(true);
    setError(null);
    try {
      const id = await generateRecipeForDish(dish);
      trackEvent("recipe_selected", {
        dishName: dish.name,
        recipeId: id,
        source: "ai-generated",
        auto: false,
      });
      router.push(`/recipe/${id}`);
    } catch (err) {
      setGenerating(false);
      setError(err.message || "Couldn't generate a recipe.");
    }
  }

  if (!dish) return null;

  const searching = !candidates && !error;

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{dish.name}</h1>

      {searching && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted">Looking for matching recipes…</p>
        </div>
      )}

      {error && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/results")}
            className="gradient-accent flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to results
          </button>
        </div>
      )}

      {candidates && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">
            We found <span className="font-mono font-bold text-accent">{candidates.length}</span>{" "}
            recipe{candidates.length === 1 ? "" : "s"} that look
            {candidates.length === 1 ? "s" : ""} similar
          </h2>
          <div className="mt-3 space-y-3">
            {candidates.map((recipe, index) => {
              const params = new URLSearchParams({
                score: recipe.matchScore.toFixed(3),
                reasons: recipe.matchReasons.join("|"),
              });
              return (
                <Link
                  key={recipe.id}
                  href={`/recipe/${recipe.id}?${params.toString()}`}
                  onClick={() =>
                    trackEvent("recipe_selected", {
                      dishName: dish.name,
                      recipeId: recipe.id,
                      source: "catalog",
                      matchScore: recipe.matchScore,
                      matchType: recipe.matchType,
                    })
                  }
                  className="block rounded-3xl border border-border bg-surface p-4 backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-surface-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted">#{index + 1}</p>
                      <h3 className="mt-0.5 truncate font-semibold text-foreground">{recipe.title}</h3>
                      <p className="mt-0.5 text-sm text-muted">
                        {recipe.cuisine} · {recipe.protein}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="gradient-text font-mono text-lg font-bold">
                        {Math.round(recipe.matchScore * 100)}%
                      </div>
                      <div className="text-xs text-muted">match</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <MatchBadge matchType={recipe.matchType} />
                  </div>

                  {recipe.matchReasons?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-muted">Why this matches</p>
                      <ul className="mt-1.5 space-y-1">
                        {recipe.matchReasons.map((reason) => (
                          <li key={reason} className="flex items-center gap-2 text-xs text-foreground/80">
                            <span className="text-emerald-600">✓</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleGenerateInstead}
            disabled={generating}
            className="gradient-accent-soft mt-4 flex w-full items-center justify-center gap-2 rounded-3xl border border-accent/30 py-3.5 text-center text-sm font-semibold text-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M12 3.5c1.5 2.2.5 3.5-.3 4.6-.9 1.2-1.2 2.4-.3 3.7 1-.3 1.6-1 1.8-1.8.9 1 1.3 2.3.8 3.7a4 4 0 1 1-6.8-3.9c.7-1 2-2.1 1.8-4.1 1 .3 1.6 1 1.8 1.9.4-1.3.3-2.7-1-4.1.8-.2 1.6-.2 2.2 0Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {generating ? "Generating…" : "None of these? Generate a new recipe"}
          </button>
        </section>
      )}
    </div>
  );
}
