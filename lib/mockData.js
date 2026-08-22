// Placeholder data standing in for the Gemini vision + recipe-retrieval pipeline.
// Shapes mirror the DishObservation / Recipe schemas from app_idea.md so the
// backend can be wired in later without reshaping the UI.

export const DISHES = {
  "chicken-tikka-masala": {
    id: "chicken-tikka-masala",
    name: "Chicken Tikka Masala",
    confidence: 0.93,
    cuisine: "Indian",
    region: "North India / UK",
    confirmedIngredients: [
      { name: "Chicken", confidence: 0.98 },
      { name: "Tomato", confidence: 0.91 },
      { name: "Onion", confidence: 0.88 },
      { name: "Cream", confidence: 0.72 },
      { name: "Garam masala", confidence: 0.81 },
    ],
    possibleIngredients: [
      { name: "Garlic", confidence: 0.54 },
      { name: "Ginger", confidence: 0.51 },
      { name: "Butter", confidence: 0.47 },
    ],
    clarifyingQuestions: [
      { id: "creamy", question: "Was the sauce creamy?", options: ["Yes", "No", "Not sure"] },
      { id: "cheese", question: "Did the dish contain cheese?", options: ["Yes", "No", "Not sure"] },
    ],
  },
};

export const MATCH_TYPE_LABELS = {
  official: "Official recipe",
  likely: "Likely recipe",
  similar: "Similar recipe",
  "ai-generated": "AI-generated approximation",
};

export const RECIPES = {
  "ctm-classic": {
    id: "ctm-classic",
    dishId: "chicken-tikka-masala",
    title: "Classic Chicken Tikka Masala",
    matchScore: 0.92,
    matchType: "likely",
    matchReasons: [
      "Same main protein",
      "Similar sauce",
      "Similar garnish",
      "Same cuisine",
      "Similar ingredient profile",
    ],
    cuisine: "Indian",
    protein: "Chicken",
    sauce: "Creamy tomato",
    garnish: "Cilantro",
    servings: 4,
    ingredients: [
      { name: "Chicken thigh, diced", quantity: 600, unit: "g" },
      { name: "Plain yogurt", quantity: 200, unit: "g" },
      { name: "Onion, diced", quantity: 1, unit: "" },
      { name: "Garlic, minced", quantity: 3, unit: "cloves" },
      { name: "Ginger, grated", quantity: 1, unit: "tbsp" },
      { name: "Crushed tomatoes", quantity: 400, unit: "g" },
      { name: "Heavy cream", quantity: 120, unit: "ml" },
      { name: "Garam masala", quantity: 2, unit: "tsp" },
      { name: "Olive oil", quantity: 2, unit: "tbsp" },
      { name: "Cilantro, chopped", quantity: 2, unit: "tbsp" },
    ],
    steps: [
      { text: "Dice the onion.", timerMinutes: null },
      { text: "Heat 2 tbsp olive oil in a pan.", timerMinutes: null },
      { text: "Marinate the chicken in yogurt and half the garam masala for 15 minutes.", timerMinutes: 15 },
      { text: "Sear the marinated chicken until lightly browned, then set aside.", timerMinutes: 6 },
      { text: "In the same pan, soften the onion, garlic, and ginger.", timerMinutes: 5 },
      { text: "Add crushed tomatoes and remaining garam masala, then simmer.", timerMinutes: 10 },
      { text: "Return the chicken to the pan and stir in the cream.", timerMinutes: null },
      { text: "Simmer until the chicken is cooked through.", timerMinutes: 8 },
      { text: "Garnish with cilantro and serve.", timerMinutes: null },
    ],
    source: {
      name: "Abracadish community recipe",
      url: null,
      license: "original",
      author: "Abracadish",
      dateAdded: "2026-01-01",
    },
  },
  "butter-chicken": {
    id: "butter-chicken",
    dishId: "chicken-tikka-masala",
    title: "Butter Chicken",
    matchScore: 0.84,
    matchType: "similar",
    matchReasons: ["Same main protein", "Similar sauce", "Same cuisine"],
    cuisine: "Indian",
    protein: "Chicken",
    sauce: "Buttery tomato",
    garnish: "Cream drizzle",
    servings: 4,
    ingredients: [
      { name: "Chicken breast, diced", quantity: 600, unit: "g" },
      { name: "Butter", quantity: 60, unit: "g" },
      { name: "Crushed tomatoes", quantity: 400, unit: "g" },
      { name: "Heavy cream", quantity: 150, unit: "ml" },
      { name: "Garam masala", quantity: 2, unit: "tsp" },
      { name: "Kashmiri chili powder", quantity: 1, unit: "tsp" },
    ],
    steps: [
      { text: "Sear the chicken in butter until golden.", timerMinutes: 6 },
      { text: "Add crushed tomatoes and spices, then simmer.", timerMinutes: 12 },
      { text: "Stir in the cream and simmer until thickened.", timerMinutes: 6 },
      { text: "Serve with a drizzle of cream.", timerMinutes: null },
    ],
    source: {
      name: "Abracadish community recipe",
      url: null,
      license: "original",
      author: "Abracadish",
      dateAdded: "2026-01-01",
    },
  },
  "chicken-korma": {
    id: "chicken-korma",
    dishId: "chicken-tikka-masala",
    title: "Chicken Korma",
    matchScore: 0.73,
    matchType: "similar",
    matchReasons: ["Same main protein", "Same cuisine", "Creamy sauce family"],
    cuisine: "Indian",
    protein: "Chicken",
    sauce: "Creamy nut-based",
    garnish: "Toasted almonds",
    servings: 4,
    ingredients: [
      { name: "Chicken thigh, diced", quantity: 600, unit: "g" },
      { name: "Yogurt", quantity: 150, unit: "g" },
      { name: "Cashew paste", quantity: 60, unit: "g" },
      { name: "Onion, sliced", quantity: 1, unit: "" },
      { name: "Coriander powder", quantity: 1, unit: "tsp" },
    ],
    steps: [
      { text: "Soften the onion, then blend into a paste.", timerMinutes: 5 },
      { text: "Sear the chicken, then add the onion paste and spices.", timerMinutes: 5 },
      { text: "Stir in yogurt and cashew paste, then simmer gently.", timerMinutes: 15 },
      { text: "Garnish with toasted almonds and serve.", timerMinutes: null },
    ],
    source: {
      name: "Abracadish community recipe",
      url: null,
      license: "original",
      author: "Abracadish",
      dateAdded: "2026-01-01",
    },
  },
};

export function getDish(dishId) {
  return DISHES[dishId] ?? null;
}

export function getRecipe(recipeId) {
  return RECIPES[recipeId] ?? null;
}

export function getRecipesForDish(dishId) {
  return Object.values(RECIPES)
    .filter((recipe) => recipe.dishId === dishId)
    .sort((a, b) => b.matchScore - a.matchScore);
}
