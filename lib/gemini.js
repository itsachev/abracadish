// Server-only: calls the Gemini API for dish recognition. Never import this from client code.

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    dish: { type: "STRING" },
    confidence: { type: "NUMBER" },
    cuisine: { type: "STRING" },
    region: { type: "STRING" },
    confirmedIngredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { name: { type: "STRING" }, confidence: { type: "NUMBER" } },
        required: ["name", "confidence"],
      },
    },
    possibleIngredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { name: { type: "STRING" }, confidence: { type: "NUMBER" } },
        required: ["name", "confidence"],
      },
    },
    clarifyingQuestions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          question: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["id", "question", "options"],
      },
    },
  },
  required: [
    "dish",
    "confidence",
    "cuisine",
    "region",
    "confirmedIngredients",
    "possibleIngredients",
    "clarifyingQuestions",
  ],
};

const PROMPT = `You are a food recognition assistant for a cooking app. Look at the photo of a dish and identify it.

Respond with your best single guess for the dish name, its likely cuisine and region, and two ingredient lists:
- confirmedIngredients: ingredients you can visually confirm with reasonable certainty (confidence >= 0.6)
- possibleIngredients: ingredients that are plausible but not clearly visible (confidence < 0.6)

Also propose 0 to 2 short clarifying questions, ONLY if answering them would meaningfully change which recipe this dish matches (for example, whether the sauce is creamy, or whether it contains cheese). Each question needs a short kebab-case id, the question text, and 2-3 short answer options. If no clarifying question would help, return an empty array.

Be honest about uncertainty: confidence must be a decimal between 0 and 1 reflecting genuine visual certainty, never inflated. Do not invent ingredients you can't reasonably infer from the image.`;

function parseDataUrl(dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Expected a base64 image data URL.");
  return { mimeType: match[1], data: match[2] };
}

function clampConfidence(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(1, Math.max(0, num));
}

function normalizeIngredientList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item.name === "string" && item.name.trim())
    .map((item) => ({ name: item.name.trim(), confidence: clampConfidence(item.confidence) }));
}

function normalizeQuestions(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(
      (q) => q && typeof q.question === "string" && Array.isArray(q.options) && q.options.length >= 2
    )
    .slice(0, 2)
    .map((q, i) => ({
      id: typeof q.id === "string" && q.id.trim() ? q.id.trim() : `question-${i}`,
      question: q.question.trim(),
      options: q.options.filter((o) => typeof o === "string").slice(0, 4),
    }));
}

export async function recognizeDish(imageDataUrl) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const { mimeType, data } = parseDataUrl(imageDataUrl);

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: PROMPT }, { inlineData: { mimeType, data } }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`Gemini recognize request failed (${response.status}):`, body.slice(0, 500));
    if (response.status === 429) {
      throw new Error("We're getting rate-limited by Gemini right now — please try again in a minute.");
    }
    throw new Error("Dish recognition is temporarily unavailable. Please try again.");
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned a response that wasn't valid JSON.");
  }

  if (!parsed.dish || typeof parsed.dish !== "string") {
    throw new Error("Gemini response was missing a dish name.");
  }

  return {
    name: parsed.dish.trim(),
    confidence: clampConfidence(parsed.confidence),
    cuisine: typeof parsed.cuisine === "string" && parsed.cuisine.trim() ? parsed.cuisine.trim() : "Unknown",
    region: typeof parsed.region === "string" && parsed.region.trim() ? parsed.region.trim() : "Unknown",
    confirmedIngredients: normalizeIngredientList(parsed.confirmedIngredients),
    possibleIngredients: normalizeIngredientList(parsed.possibleIngredients),
    clarifyingQuestions: normalizeQuestions(parsed.clarifyingQuestions),
  };
}
