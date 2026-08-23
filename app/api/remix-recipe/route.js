import { NextResponse } from "next/server";
import { remixRecipe } from "@/lib/gemini";
import { embedText } from "@/lib/embeddings";
import { buildRecipeEmbeddingText } from "@/lib/recipeMatch";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { recipe, constraint } = body ?? {};
  if (!recipe || typeof recipe.title !== "string" || !recipe.title.trim()) {
    return NextResponse.json({ error: "Expected a recipe with a title." }, { status: 400 });
  }
  if (typeof constraint !== "string" || !constraint.trim()) {
    return NextResponse.json({ error: "Expected a constraint to remix by." }, { status: 400 });
  }

  try {
    const remixed = await remixRecipe(recipe, constraint);

    let embedding = null;
    try {
      embedding = await embedText(buildRecipeEmbeddingText(remixed));
    } catch (embedError) {
      console.error("Embedding a remixed recipe failed:", embedError);
    }

    return NextResponse.json({ recipe: remixed, embedding });
  } catch (error) {
    console.error("Recipe remix failed:", error);
    const message = error instanceof Error ? error.message : "Recipe remix failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
