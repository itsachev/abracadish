import { NextResponse } from "next/server";
import { recognizeDish } from "@/lib/gemini";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { image } = body ?? {};
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Expected a base64 image data URL." }, { status: 400 });
  }

  try {
    const dish = await recognizeDish(image);
    return NextResponse.json(dish);
  } catch (error) {
    console.error("Dish recognition failed:", error);
    const message = error instanceof Error ? error.message : "Recognition failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
