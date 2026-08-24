"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrGenerateRemixId } from "@/lib/recipeRemix";

const CONSTRAINTS = ["Vegan", "Vegetarian", "Gluten-free", "Dairy-free", "Low-carb", "Spicier"];

export default function RecipeRemixBar({ recipe }) {
  const router = useRouter();
  const [loadingConstraint, setLoadingConstraint] = useState(null);
  const [error, setError] = useState(null);

  const options = CONSTRAINTS.filter(
    (c) => c.toLowerCase() !== (recipe.source?.remixLabel ?? "").toLowerCase()
  );

  async function handleRemix(constraint) {
    setLoadingConstraint(constraint);
    setError(null);
    try {
      const id = await getOrGenerateRemixId(recipe, constraint);
      router.push(`/recipe/${id}`);
    } catch (err) {
      setLoadingConstraint(null);
      setError(err.message || "Couldn't remix this recipe.");
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-border bg-surface p-4 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-foreground">Remix this recipe</h2>
      <p className="text-xs text-muted">Let AI rework it to fit a constraint.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((constraint) => (
          <button
            key={constraint}
            type="button"
            onClick={() => handleRemix(constraint)}
            disabled={loadingConstraint !== null}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
              <path
                d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            {loadingConstraint === constraint ? "Remixing…" : constraint}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  );
}
