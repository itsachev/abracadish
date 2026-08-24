import { getSupabaseClient } from "@/lib/supabaseClient";

const PHOTO_BUCKET = "scan-photos";

function normalizeScanRow(row) {
  const supabase = getSupabaseClient();
  return {
    id: row.id,
    dishName: row.dish_name,
    confidence: row.confidence,
    cuisine: row.cuisine,
    region: row.region,
    confirmedIngredients: row.confirmed_ingredients ?? [],
    possibleIngredients: row.possible_ingredients ?? [],
    answers: row.answers ?? {},
    restaurantName: row.restaurant_name,
    location: row.location,
    locationLabel: row.location_label,
    createdAt: row.created_at,
    imageUrl: row.image_path
      ? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(row.image_path).data.publicUrl
      : null,
  };
}

export async function getScansForUser(userId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeScanRow);
}

export async function getScanById(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("scans").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeScanRow(data) : null;
}

// Uploads a captured dish photo (data URL) to the user's folder in the
// scan-photos bucket and returns its storage path, or null if it fails —
// the scan itself is still worth saving without a photo.
export async function uploadScanPhoto(userId, dataUrl) {
  try {
    const blob = await fetch(dataUrl).then((res) => res.blob());
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const supabase = getSupabaseClient();
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return path;
  } catch {
    return null;
  }
}

// { totalCount, sampleDishes } for a restaurant name, via a security-definer
// RPC (see supabase/schema_restaurant_stats.sql) — the "scans" table's RLS
// normally restricts reads to a user's own rows, but this function returns
// only an aggregate count and a handful of dish names, never who scanned
// them, so it's safe to expose across users for the "N people have scanned
// dishes here" social-proof prompt.
export async function getRestaurantScanStats(restaurantName) {
  const trimmed = restaurantName?.trim();
  if (!trimmed) return { totalCount: 0, sampleDishes: [] };

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc("get_restaurant_scan_stats", { p_restaurant_name: trimmed })
    .maybeSingle();
  if (error) throw new Error(error.message);

  return {
    totalCount: Number(data?.total_count ?? 0),
    sampleDishes: data?.sample_dishes ?? [],
  };
}

export async function deleteScan(id) {
  const supabase = getSupabaseClient();
  const { data: row } = await supabase.from("scans").select("image_path").eq("id", id).maybeSingle();

  const { error } = await supabase.from("scans").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (row?.image_path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([row.image_path]).catch(() => {});
  }
}
