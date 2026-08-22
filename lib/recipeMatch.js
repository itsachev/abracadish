// Shared, secret-free helpers used by both the seed script and the
// /api/match-recipes route: building the text that gets embedded, and
// explaining *why* a candidate recipe matched a recognized dish.

export const MATCH_TYPE_LABELS = {
  official: "Official recipe",
  likely: "Likely recipe",
  similar: "Similar recipe",
  "ai-generated": "AI-generated approximation",
};

export function buildRecipeEmbeddingText(recipe) {
  const ingredientNames = recipe.ingredients?.map((i) => i.name).join(", ");
  return [
    recipe.title,
    recipe.cuisine && `Cuisine: ${recipe.cuisine}`,
    recipe.protein && `Protein: ${recipe.protein}`,
    recipe.sauce && `Sauce: ${recipe.sauce}`,
    recipe.garnish && `Garnish: ${recipe.garnish}`,
    ingredientNames && `Ingredients: ${ingredientNames}`,
  ]
    .filter(Boolean)
    .join(". ");
}

export function buildDishQueryText(dish) {
  const confirmed = dish.confirmedIngredients?.map((i) => i.name).join(", ");
  const possible = dish.possibleIngredients?.map((i) => i.name).join(", ");
  return [
    dish.name,
    dish.cuisine && `Cuisine: ${dish.cuisine}`,
    dish.region && `Region: ${dish.region}`,
    confirmed && `Confirmed ingredients: ${confirmed}`,
    possible && `Possible ingredients: ${possible}`,
  ]
    .filter(Boolean)
    .join(". ");
}

function norm(value) {
  return (value ?? "").toString().toLowerCase().trim();
}

export function computeMatchReasons(dish, recipe) {
  const reasons = [];

  if (dish.cuisine && recipe.cuisine && norm(dish.cuisine) === norm(recipe.cuisine)) {
    reasons.push("Same cuisine");
  }

  const dishIngredients = [...(dish.confirmedIngredients ?? []), ...(dish.possibleIngredients ?? [])];

  if (recipe.protein) {
    const proteinMentioned = dishIngredients.some(
      (ing) => norm(ing.name).includes(norm(recipe.protein)) || norm(recipe.protein).includes(norm(ing.name))
    );
    if (proteinMentioned) reasons.push("Same main protein");
  }

  const dishIngredientNames = new Set(dishIngredients.map((i) => norm(i.name)));
  const overlap = (recipe.ingredients ?? []).filter((i) => dishIngredientNames.has(norm(i.name)));
  if (overlap.length > 0) {
    reasons.push(`Overlapping ingredients: ${overlap.map((i) => i.name).join(", ")}`);
  }

  if (reasons.length === 0) {
    reasons.push("Similar overall ingredient profile");
  }

  return reasons;
}
