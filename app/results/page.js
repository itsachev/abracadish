"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RecipeCard from "@/components/RecipeCard";
import ConfidenceBar from "@/components/ConfidenceBar";

const PHOTO_KEY = "abracadish:lastPhoto";

export default function ResultsPage() {
  const router = useRouter();
  const [photo] = useState(() =>
    typeof window === "undefined" ? null : sessionStorage.getItem(PHOTO_KEY)
  );
  const [dish, setDish] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [recipes, setRecipes] = useState(null);
  const [matchError, setMatchError] = useState(null);

  useEffect(() => {
    if (!photo) {
      router.replace("/scan");
      return;
    }

    let cancelled = false;

    fetch("/api/recognize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: photo }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Recognition failed.");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setDish(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Something went wrong.");
      });

    return () => {
      cancelled = true;
    };
  }, [photo, router]);

  useEffect(() => {
    if (!dish) return;
    let cancelled = false;

    fetch("/api/match-recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dish }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Recipe matching failed.");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setRecipes(data.recipes ?? []);
      })
      .catch((err) => {
        if (!cancelled) setMatchError(err.message || "Couldn't find matching recipes.");
      });

    return () => {
      cancelled = true;
    };
  }, [dish]);

  if (!photo) return null;

  const analyzing = !dish && !error;
  const matching = Boolean(dish) && recipes === null && !matchError;

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="Captured dish" className="h-56 w-full object-cover" />
        <button
          type="button"
          onClick={() => router.push("/scan")}
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <path
              d="M4 4v5h5M20 20v-5h-5M4.5 15a8 8 0 0 0 14.5 3.5M19.5 9A8 8 0 0 0 5 5.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Retake
        </button>
      </div>

      {analyzing && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted">Analyzing your photo…</p>
        </div>
      )}

      {error && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/scan")}
            className="gradient-accent rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            Try another photo
          </button>
        </div>
      )}

      {dish && (
        <>
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{dish.name}</h1>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                {Math.round(dish.confidence * 100)}% confidence
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {dish.cuisine} · {dish.region}
            </p>
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Likely ingredients
            </h2>
            <ul className="mt-2 space-y-1.5">
              {dish.confirmedIngredients.map((ingredient) => (
                <li key={ingredient.name} className="flex items-center gap-2 text-sm text-foreground/90">
                  <span className="text-emerald-400">✓</span>
                  {ingredient.name}
                  <span className="font-mono text-xs text-muted">{Math.round(ingredient.confidence * 100)}%</span>
                </li>
              ))}
            </ul>
            {dish.possibleIngredients.length > 0 && (
              <>
                <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted">
                  Possible
                </h2>
                <ul className="mt-2 space-y-1.5">
                  {dish.possibleIngredients.map((ingredient) => (
                    <li key={ingredient.name} className="flex items-center gap-2 text-sm text-muted">
                      <span>?</span>
                      {ingredient.name}
                      <span className="font-mono text-xs text-muted">{Math.round(ingredient.confidence * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {dish.clarifyingQuestions.length > 0 && (
            <section className="mt-6 rounded-2xl border border-border bg-surface p-4 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-foreground">
                A couple quick questions
              </h2>
              <p className="text-xs text-muted">Helps us find a closer recipe match.</p>
              <div className="mt-3 space-y-4">
                {dish.clarifyingQuestions.map((q) => (
                  <div key={q.id}>
                    <p className="text-sm text-foreground/90">{q.question}</p>
                    <div className="mt-2 flex gap-2">
                      {q.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: option }))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            answers[q.id] === option
                              ? "border-accent/50 bg-accent-soft text-accent"
                              : "border-border text-muted"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Recipe match
            </h2>

            {matching && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                Searching our recipe catalog…
              </div>
            )}

            {matchError && (
              <div className="mt-3 rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
                {matchError}
              </div>
            )}

            {recipes && recipes.length > 0 && (
              <>
                <div className="mt-2">
                  <ConfidenceBar label="Overall recipe match" value={recipes[0]?.matchScore ?? 0} />
                </div>
                <p className="mb-2 mt-4 text-sm text-muted">
                  We found {recipes.length} recipes that look similar.
                </p>
                <div className="space-y-3">
                  {recipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </>
            )}

            {recipes && recipes.length === 0 && (
              <div className="mt-3 rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
                We don&apos;t have recipes for &quot;{dish.name}&quot; in our starter collection yet
                — try photographing a chicken tikka masala for the full demo, or check back soon
                as we grow the recipe database.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
