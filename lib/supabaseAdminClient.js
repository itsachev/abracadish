import { createClient } from "@supabase/supabase-js";

let client = null;

// Service-role key, bypasses RLS entirely — server-only, never import this
// from a client component. Used where a job needs to read/write across all
// users (e.g. the streak-reminder cron scanning every user's scan history),
// not just the signed-in caller's own rows.
export function getSupabaseAdminClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase URL/service role key are not configured.");
  }

  client = createClient(url, serviceKey, { auth: { persistSession: false } });
  return client;
}
