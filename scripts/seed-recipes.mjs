// One-off script: embeds and upserts the starter recipe catalog into Supabase.
// Run manually with: node scripts/seed-recipes.mjs
// Uses SUPABASE_SERVICE_ROLE_KEY directly (bypasses RLS) — never import this
// file from application code.

import { createClient } from "@supabase/supabase-js";
import { buildRecipeEmbeddingText } from "../lib/recipeMatch.js";

process.loadEnvFile(".env.local");

const RECIPES = [
  {
    id: "ctm-classic",
    title: "Classic Chicken Tikka Masala",
    matchType: "likely",
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
  {
    id: "butter-chicken",
    title: "Butter Chicken",
    matchType: "similar",
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
  {
    id: "chicken-korma",
    title: "Chicken Korma",
    matchType: "similar",
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
];

const EMBEDDING_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

async function embedText(apiKey, text) {
  const response = await fetch(EMBEDDING_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: 768 }),
  });
  if (!response.ok) {
    throw new Error(`Embedding request failed (${response.status}): ${await response.text()}`);
  }
  const payload = await response.json();
  return payload.embedding.values;
}

async function main() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!geminiKey || !supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  for (const recipe of RECIPES) {
    process.stdout.write(`Embedding "${recipe.title}"... `);
    const embedding = await embedText(geminiKey, buildRecipeEmbeddingText(recipe));

    const { error } = await supabase.from("recipes").upsert({
      id: recipe.id,
      title: recipe.title,
      cuisine: recipe.cuisine,
      protein: recipe.protein,
      sauce: recipe.sauce,
      garnish: recipe.garnish,
      match_type: recipe.matchType,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      source: recipe.source,
      embedding,
    });

    if (error) {
      console.log("FAILED");
      throw new Error(`Upsert failed for ${recipe.id}: ${error.message}`);
    }
    console.log("done");
  }

  console.log(`\nSeeded ${RECIPES.length} recipes.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
