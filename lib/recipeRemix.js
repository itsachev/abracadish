import { getRecipeById, saveAiGeneratedRecipe } from "@/lib/recipes";

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Deterministic id per (recipe, constraint) pair, so remixing the same
// recipe by the same constraint again reuses the saved result instead of
// calling Gemini a second time. Remixing a remix chains the id, so
// "vegan" then "spicier" produces its own distinct, cacheable recipe.
export async function getOrGenerateRemixId(recipe, constraint) {
  const id = `${recipe.id}-remix-${slugify(constraint)}`;

  const existing = await getRecipeById(id);
  if (existing) return id;

  const response = await fetch("/api/remix-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipe, constraint }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Couldn't remix this recipe.");
  }

  const { recipe: remixed, embedding } = await response.json();
  await saveAiGeneratedRecipe(id, remixed, embedding, {
    remixOf: recipe.id,
    remixOfTitle: recipe.title,
    remixLabel: constraint,
  });
  return id;
}
