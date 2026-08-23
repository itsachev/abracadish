import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

// Mirrors /api/auth/login — clears the session cookie via the response's
// Set-Cookie header rather than a client-side document.cookie write.
export async function POST() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
