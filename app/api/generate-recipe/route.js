import { NextResponse } from "next/server";
import { generateRecipe } from "@/lib/gemini";
import { embedText } from "@/lib/embeddings";
import { buildRecipeEmbeddingText } from "@/lib/recipeMatch";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { dish } = body ?? {};
  if (!dish || typeof dish.name !== "string" || !dish.name.trim()) {
    return NextResponse.json({ error: "Expected a dish with a name." }, { status: 400 });
  }

  try {
    const recipe = await generateRecipe(dish);

    // Embedding this recipe lets it surface later via /api/match-recipes for
    // someone else's similar scan, so the AI-generated fallback actually
    // grows the retrievable catalog instead of being a dead end each time.
    // Best-effort: a failure here shouldn't block handing back the recipe.
    let embedding = null;
    try {
      embedding = await embedText(buildRecipeEmbeddingText(recipe));
    } catch (embedError) {
      console.error("Embedding a generated recipe failed:", embedError);
    }

    return NextResponse.json({ recipe, embedding });
  } catch (error) {
    console.error("Recipe generation failed:", error);
    const message = error instanceof Error ? error.message : "Recipe generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
