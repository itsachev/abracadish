import { NextResponse } from "next/server";
import { embedText } from "@/lib/embeddings";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { buildDishQueryText, computeMatchReasons } from "@/lib/recipeMatch";

// Cosine similarity below this is treated as "not actually a match" rather than
// forcing the nearest neighbor through. Conservative starting point — retune
// once the catalog has enough recipes to calibrate against real queries.
const MIN_SIMILARITY = 0.65;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const dish = body?.dish;
  if (!dish || typeof dish.name !== "string") {
    return NextResponse.json({ error: "Expected a recognized dish object." }, { status: 400 });
  }

  try {
    const queryEmbedding = await embedText(buildDishQueryText(dish));

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("match_recipes", {
      query_embedding: queryEmbedding,
      match_count: 5,
    });
    if (error) throw new Error(error.message);

    const recipes = (data ?? [])
      .filter((row) => row.similarity >= MIN_SIMILARITY)
      .map((row) => ({
        id: row.id,
        title: row.title,
        cuisine: row.cuisine,
        protein: row.protein,
        sauce: row.sauce,
        garnish: row.garnish,
        matchType: row.match_type,
        matchScore: row.similarity,
        matchReasons: computeMatchReasons(dish, row),
      }));

    return NextResponse.json({ recipes });
  } catch (error) {
    console.error("Recipe matching failed:", error);
    const message = error instanceof Error ? error.message : "Recipe matching failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
