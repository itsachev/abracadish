"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RecipeCard from "@/components/RecipeCard";
import ConfidenceBar from "@/components/ConfidenceBar";
import { getDish, getRecipesForDish } from "@/lib/mockData";

const PHOTO_KEY = "abracadish:lastPhoto";
const RECOGNIZED_DISH_ID = "chicken-tikka-masala";

export default function ResultsPage() {
  const router = useRouter();
  const [photo] = useState(() =>
    typeof window === "undefined" ? null : sessionStorage.getItem(PHOTO_KEY)
  );
  const [analyzing, setAnalyzing] = useState(true);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (!photo) {
      router.replace("/scan");
      return;
    }
    const timer = setTimeout(() => setAnalyzing(false), 1200);
    return () => clearTimeout(timer);
  }, [photo, router]);

  if (!photo) return null;

  const dish = getDish(RECOGNIZED_DISH_ID);
  const recipes = getRecipesForDish(RECOGNIZED_DISH_ID);

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="Captured dish" className="h-56 w-full object-cover" />
      </div>

      {analyzing ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted">Analyzing your photo…</p>
        </div>
      ) : (
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
          </section>
        </>
      )}
    </div>
  );
}
