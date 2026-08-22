import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/reverseGeocode";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { lat, lng } = body ?? {};
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Expected numeric lat/lng." }, { status: 400 });
  }

  try {
    const label = await reverseGeocode(lat, lng);
    return NextResponse.json({ label });
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return NextResponse.json({ error: "Couldn't resolve a location name." }, { status: 502 });
  }
}
