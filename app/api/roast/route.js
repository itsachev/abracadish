import { NextResponse } from "next/server";
import { roastDish } from "@/lib/gemini";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { image, dishName } = body ?? {};
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Expected a base64 image data URL." }, { status: 400 });
  }

  try {
    const roast = await roastDish(image, typeof dishName === "string" ? dishName : null);
    return NextResponse.json({ roast });
  } catch (error) {
    console.error("Roast failed:", error);
    const message = error instanceof Error ? error.message : "Roast failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
