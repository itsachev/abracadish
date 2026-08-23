import { NextResponse } from "next/server";

// TEMPORARY — reports what the SERVER actually sees in the incoming
// Cookie header, independent of the client's own document.cookie reads.
// If this shows the sb-* cookie while the client-side debug panel shows
// none, it proves the browser IS storing/sending the cookie correctly and
// the failure is specifically in this device's JS-side document.cookie
// read, not the cookie itself.
export async function GET(request) {
  const rawCookieHeader = request.headers.get("cookie") ?? "";
  const cookieNames = rawCookieHeader
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);
  return NextResponse.json({ cookieNames, rawCookieHeader });
}
