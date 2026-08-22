import { NextResponse } from "next/server";
import { generateRecipe } from "@/lib/gemini";

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
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Recipe generation failed:", error);
    const message = error instanceof Error ? error.message : "Recipe generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
