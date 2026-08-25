"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/trackEvent";

export default function IngredientSubstituteSheet({ recipe, onClose }) {
  const [results, setResults] = useState({});

  async function handleSubstitute(ingredient) {
    setResults((prev) => ({ ...prev, [ingredient.name]: { status: "loading" } }));
    try {
      const res = await fetch("/api/substitute-ingredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: { title: recipe.title, cuisine: recipe.cuisine, ingredients: recipe.ingredients },
          ingredient,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't find a substitute.");
      setResults((prev) => ({ ...prev, [ingredient.name]: { status: "done", ...data } }));
      trackEvent("ingredient_substitute_used", {
        recipeId: recipe.id,
        dishName: recipe.title,
        ingredient: ingredient.name,
      });
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [ingredient.name]: { status: "error", error: err.message || "Couldn't find a substitute." },
      }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close ingredients"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[75vh] w-full max-w-md flex-col rounded-t-3xl border border-border bg-surface pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-base font-semibold text-foreground">Ingredients</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="px-5 pt-1 text-xs text-muted">Missing something? Tap it for a substitute.</p>
        <div className="mt-2 flex-1 overflow-y-auto px-5 pb-2">
          <ul className="divide-y divide-border">
            {recipe.ingredients.map((ingredient) => {
              const result = results[ingredient.name];
              return (
                <li key={ingredient.name} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground">
                      {[ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSubstitute(ingredient)}
                      disabled={result?.status === "loading"}
                      className="shrink-0 rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent disabled:opacity-50"
                    >
                      {result?.status === "loading" ? "Thinking…" : "Don't have this?"}
                    </button>
                  </div>
                  {result?.status === "done" && (
                    <div className="mt-2 rounded-2xl bg-black/5 p-3 text-xs text-muted">
                      <p className="font-semibold text-foreground">
                        Use {result.amount ? `${result.amount} ` : ""}
                        {result.substitute}
                      </p>
                      {result.note && <p className="mt-1">{result.note}</p>}
                    </div>
                  )}
                  {result?.status === "error" && (
                    <p className="mt-2 text-xs text-red-600">{result.error}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
