import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

// Mirrors /api/auth/login — signs up server-side so any session returned
// immediately (email confirmation off) is set via Set-Cookie rather than a
// client-side document.cookie write.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, password } = body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const { origin } = new URL(request.url);
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Whether this returns a live session depends on the project's "confirm
  // email" setting in Supabase — with it on (the default), there's no
  // session until the user clicks the emailed link.
  return NextResponse.json({ hasSession: !!data.session });
}
