import { createClient } from "@supabase/supabase-js";

let client = null;

// Anon/publishable key only, no session persistence — the "recipes" table
// is fully public (open read, and inserts of AI-generated recipes are open
// to signed-out users too per its RLS policy), so catalog reads/writes
// never need to know who's signed in. Safe to call from either a real
// Server Component or a client component: unlike the cookie-backed client
// in lib/supabaseClient.js, this one touches no browser/request storage,
// so it works identically in both environments.
export function getSupabasePublicClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase URL/anon key are not configured.");
  }

  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}
