import { createClient } from "@supabase/supabase-js";

let client = null;

// Anon/publishable key only — table reads are gated by RLS policies in
// supabase/schema.sql. Writes that must bypass RLS (the seed script) use the
// service-role key directly and never go through this shared client.
//
// Session persistence is on so this same client also drives user auth
// (sign in/up/out) from client components — harmless for the server-side
// callers (lib/recipes.js) since there's no `window` there to persist to.
export function getSupabaseClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase URL/anon key are not configured.");
  }

  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
