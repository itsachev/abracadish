// Server-only: calls the Gemini API for text embeddings. Never import this from client code.

const EMBEDDING_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

export const EMBEDDING_DIMENSIONS = 768;

export async function embedText(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const response = await fetch(EMBEDDING_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`Gemini embedding request failed (${response.status}):`, body.slice(0, 500));
    if (response.status === 429) {
      throw new Error("We're getting rate-limited by Gemini right now — please try again in a minute.");
    }
    throw new Error("Recipe matching is temporarily unavailable. Please try again.");
  }

  const payload = await response.json();
  const values = payload?.embedding?.values;
  if (!Array.isArray(values)) {
    throw new Error("Gemini embedding response was missing values.");
  }
  return values;
}
