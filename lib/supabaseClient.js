import { createClient } from "@supabase/supabase-js";

let client = null;

// Anon/publishable key only — reads are gated by the "Public read access" RLS
// policy in supabase/schema.sql. Writes (the seed script) use the service-role
// key directly and never go through this shared client.
export function getSupabaseClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase URL/anon key are not configured.");
  }

  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}
