import { getSupabaseClient } from "@/lib/supabaseClient";

function normalizeRecipeRow(row) {
  return {
    id: row.id,
    title: row.title,
    cuisine: row.cuisine,
    protein: row.protein,
    sauce: row.sauce,
    garnish: row.garnish,
    matchType: row.match_type,
    servings: row.servings,
    ingredients: row.ingredients ?? [],
    steps: row.steps ?? [],
    source: row.source ?? {},
  };
}

export async function getRecipeById(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeRecipeRow(data) : null;
}

export async function getRecipesByIds(ids) {
  if (!ids.length) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("recipes").select("*").in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeRecipeRow);
}
