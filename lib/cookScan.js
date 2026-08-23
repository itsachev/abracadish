import { getRecipeById, saveAiGeneratedRecipe } from "@/lib/recipes";

function cacheKey(scanId) {
  return `abracadish:scanRecipe:${scanId}`;
}

function readCachedRecipeId(scanId) {
  try {
    return sessionStorage.getItem(cacheKey(scanId));
  } catch {
    return null;
  }
}

function writeCachedRecipeId(scanId, recipeId) {
  try {
    sessionStorage.setItem(cacheKey(scanId), recipeId);
  } catch {
    // best-effort only — a cache miss just means one extra lookup next click.
  }
}

function scanToDish(scan) {
  return {
    name: scan.dishName,
    cuisine: scan.cuisine,
    region: scan.region,
    confirmedIngredients: scan.confirmedIngredients,
    possibleIngredients: scan.possibleIngredients,
    answers: scan.answers,
  };
}

async function findCatalogMatch(dish) {
  const response = await fetch("/api/match-recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dish }),
  });
  if (!response.ok) return null;

  const { recipes } = await response.json();
  return recipes?.[0]?.id ?? null;
}

async function generateAndSaveRecipe(id, dish) {
  const response = await fetch("/api/generate-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dish }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Couldn't generate a recipe.");
  }

  const { recipe, embedding } = await response.json();
  await saveAiGeneratedRecipe(id, recipe, embedding);
  return id;
}

// Retrieval-first: reuses whatever recipe this scan resolved to last time,
// otherwise looks for a real catalog match before falling back to a
// Gemini-generated approximation. Returns the recipes.id to navigate to.
export async function getOrGenerateRecipeIdForScan(scan) {
  const cached = readCachedRecipeId(scan.id);
  if (cached && (await getRecipeById(cached))) return cached;

  const dish = scanToDish(scan);

  const matchedId = await findCatalogMatch(dish);
  const recipeId = matchedId ?? (await generateAndSaveRecipe(`ai-${scan.id}`, dish));

  writeCachedRecipeId(scan.id, recipeId);
  return recipeId;
}

// Same retrieval-first resolution, but for a freshly recognized dish on
// /results that hasn't been saved as a `scans` row yet (so there's no
// scan.id to key the cache or the AI-generated recipe's id off of).
export async function getOrGenerateRecipeIdForDish(dish) {
  const matchedId = await findCatalogMatch(dish);
  if (matchedId) return matchedId;

  const id = `ai-${crypto.randomUUID()}`;
  return generateAndSaveRecipe(id, dish);
}
