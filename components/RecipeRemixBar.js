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
    <section className="mt-6 rounded-2xl border border-border bg-surface p-4 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-foreground">Remix this recipe</h2>
      <p className="text-xs text-muted">Let AI rework it to fit a constraint.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((constraint) => (
          <button
            key={constraint}
            type="button"
            onClick={() => handleRemix(constraint)}
            disabled={loadingConstraint !== null}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground disabled:opacity-50"
          >
            {loadingConstraint === constraint ? "Remixing…" : constraint}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </section>
  );
}
