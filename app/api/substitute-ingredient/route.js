import { NextResponse } from "next/server";
import { substituteIngredient } from "@/lib/gemini";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { recipe, ingredient } = body ?? {};
  if (!recipe || typeof recipe.title !== "string" || !recipe.title.trim()) {
    return NextResponse.json({ error: "Expected a recipe with a title." }, { status: 400 });
  }
  if (!ingredient || typeof ingredient.name !== "string" || !ingredient.name.trim()) {
    return NextResponse.json({ error: "Expected an ingredient with a name." }, { status: 400 });
  }

  try {
    const result = await substituteIngredient(recipe, ingredient);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Ingredient substitution failed:", error);
    const message = error instanceof Error ? error.message : "Substitution failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
