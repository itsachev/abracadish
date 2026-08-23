import { createBrowserClient } from "@supabase/ssr";

let client = null;

// User-session-aware client — auth (sign in/up/out) and any RLS-scoped
// queries that depend on who's signed in (e.g. the "scans" table). Backed
// by cookies rather than localStorage so the session round-trips through
// SSR and isn't lost to mobile Safari's localStorage/ITP quirks, which
// were logging users out on a simple page refresh on phones.
//
// Browser-only by design (createBrowserClient reads/writes document.cookie).
// Server-side code that needs the public recipe catalog — which requires no
// user session at all — uses lib/supabasePublicClient.js instead.
export function getSupabaseClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase URL/anon key are not configured.");
  }

  client = createBrowserClient(url, anonKey);
  return client;
}
