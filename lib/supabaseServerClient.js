import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie-aware client for Route Handlers, where cookies() can both read the
// incoming request's cookies and write Set-Cookie headers onto the
// response. Used for auth operations (sign in/out) that need the session
// cookie set at the HTTP level rather than via client-side JS.
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}
