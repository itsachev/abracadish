import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

// Signup emails a confirmation link that redirects here with a `code` param
// (PKCE flow, used by the cookie-backed browser client). Exchanging it
// server-side lets us set the session cookie directly on the redirect
// response, so the user lands on "/" already signed in.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/`);
}
