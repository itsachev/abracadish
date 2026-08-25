// Server-only: calls the Gemini API for dish recognition. Never import this from client code.

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    dish: { type: "STRING" },
    confidence: { type: "NUMBER" },
    classification: { type: "STRING" },
    cuisine: { type: "STRING" },
    region: { type: "STRING" },
    protein: { type: "STRING" },
    sauce: { type: "STRING" },
    garnish: { type: "STRING" },
    preparationTechnique: { type: "STRING" },
    texture: { type: "STRING" },
    visualCharacteristics: { type: "STRING" },
    ingredientCombinations: { type: "ARRAY", items: { type: "STRING" } },
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
    "classification",
    "cuisine",
    "region",
    "protein",
    "sauce",
    "garnish",
    "preparationTechnique",
    "texture",
    "visualCharacteristics",
    "ingredientCombinations",
    "confirmedIngredients",
    "possibleIngredients",
    "clarifyingQuestions",
  ],
};

const PROMPT = `You are a food recognition assistant for a cooking app. Look at the photo of a dish and identify it.

Respond with your best single guess for the dish name, its likely cuisine and region, and two ingredient lists:
- confirmedIngredients: ingredients you can visually confirm with reasonable certainty (confidence >= 0.6)
- possibleIngredients: ingredients that are plausible but not clearly visible (confidence < 0.6)

Also describe the dish along these structured attributes, used later for recipe matching — leave any that don't apply or aren't determinable as an empty string:
- classification: the dish category (e.g. "Soup", "Salad", "Main course", "Dessert", "Appetizer", "Bread", "Beverage")
- protein: the main protein, if any (e.g. "Chicken", "Tofu")
- sauce: the sauce or dressing, if any (e.g. "Creamy tomato", "Vinaigrette")
- garnish: the garnish or topping, if any (e.g. "Cilantro", "Toasted sesame")
- preparationTechnique: the primary cooking method (e.g. "Grilled", "Deep-fried", "Simmered", "Baked", "Raw")
- texture: a short phrase on texture (e.g. "Crispy exterior, tender inside")
- visualCharacteristics: a short phrase on distinctive visual appearance (color, plating, shape)
- ingredientCombinations: 0-3 short phrases naming notable ingredient pairings that define the dish (e.g. "Chicken with creamy tomato sauce")

Also propose 0 to 2 short clarifying questions, ONLY if answering them would meaningfully change which recipe this dish matches (for example, whether the sauce is creamy, or whether it contains cheese). Each question needs a short kebab-case id, the question text, and 2-3 short answer options. If no clarifying question would help, return an empty array.

Be honest about uncertainty: confidence must be a decimal between 0 and 1 reflecting genuine visual certainty, never inflated. Do not invent ingredients or attributes you can't reasonably infer from the image.`;

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

function normalizeOptionalText(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStringList(list, max) {
  if (!Array.isArray(list)) return [];
  return list.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()).slice(0, max);
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

const RECIPE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    servings: { type: "NUMBER" },
    protein: { type: "STRING" },
    sauce: { type: "STRING" },
    garnish: { type: "STRING" },
    ingredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          quantity: { type: "NUMBER" },
          unit: { type: "STRING" },
        },
        required: ["name", "quantity", "unit"],
      },
    },
    steps: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING" },
          timerMinutes: { type: "NUMBER" },
        },
        required: ["text"],
      },
    },
  },
  required: ["title", "servings", "ingredients", "steps"],
};

function buildRecipePrompt(dish) {
  const confirmed = dish.confirmedIngredients?.map((i) => i.name).join(", ");
  const possible = dish.possibleIngredients?.map((i) => i.name).join(", ");
  const answers = dish.answers && Object.keys(dish.answers).length
    ? Object.values(dish.answers).join(", ")
    : null;

  return `You are a cooking assistant for a recipe app. Write a complete, cookable home recipe that approximates the dish described below. You have not seen the actual dish being made — this is your best reasonable approximation, so keep it realistic and achievable with common techniques.

Dish: ${dish.name}
${dish.cuisine ? `Cuisine: ${dish.cuisine}` : ""}
${dish.region ? `Region: ${dish.region}` : ""}
${confirmed ? `Ingredients observed: ${confirmed}` : ""}
${possible ? `Ingredients possibly present: ${possible}` : ""}
${answers ? `Additional details: ${answers}` : ""}

Return a recipe title, servings (a whole number), the likely main protein/sauce/garnish (short phrases, empty string if not applicable), a full ingredient list with realistic quantities and units, and clear step-by-step instructions. Give a timerMinutes value on any step that involves waiting (cooking, simmering, baking, resting) and omit it otherwise.`;
}

function normalizeRecipeIngredients(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item.name === "string" && item.name.trim())
    .map((item) => ({
      name: item.name.trim(),
      quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : null,
      unit: typeof item.unit === "string" ? item.unit.trim() : "",
    }));
}

function normalizeRecipeSteps(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item.text === "string" && item.text.trim())
    .map((item) => ({
      text: item.text.trim(),
      timerMinutes: Number.isFinite(Number(item.timerMinutes)) && Number(item.timerMinutes) > 0
        ? Number(item.timerMinutes)
        : null,
    }));
}

async function callGeminiForRecipe(prompt, cuisine) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RECIPE_RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`Gemini recipe-generation request failed (${response.status}):`, body.slice(0, 500));
    if (response.status === 429) {
      throw new Error("We're getting rate-limited by Gemini right now — please try again in a minute.");
    }
    throw new Error("Recipe generation is temporarily unavailable. Please try again.");
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

  if (!parsed.title || typeof parsed.title !== "string") {
    throw new Error("Gemini response was missing a recipe title.");
  }

  const steps = normalizeRecipeSteps(parsed.steps);
  if (steps.length === 0) {
    throw new Error("Gemini response was missing recipe steps.");
  }

  return {
    title: parsed.title.trim(),
    servings: Number.isFinite(Number(parsed.servings)) ? Math.round(Number(parsed.servings)) : 4,
    cuisine: typeof cuisine === "string" && cuisine.trim() ? cuisine.trim() : null,
    protein: typeof parsed.protein === "string" && parsed.protein.trim() ? parsed.protein.trim() : null,
    sauce: typeof parsed.sauce === "string" && parsed.sauce.trim() ? parsed.sauce.trim() : null,
    garnish: typeof parsed.garnish === "string" && parsed.garnish.trim() ? parsed.garnish.trim() : null,
    ingredients: normalizeRecipeIngredients(parsed.ingredients),
    steps,
  };
}

// dish: { name, cuisine?, region?, confirmedIngredients?, possibleIngredients?, answers? }
export async function generateRecipe(dish) {
  return callGeminiForRecipe(buildRecipePrompt(dish), dish.cuisine);
}

function buildRemixPrompt(recipe, constraint) {
  const ingredientLines = recipe.ingredients
    ?.map((i) => `${i.quantity ?? ""} ${i.unit ?? ""} ${i.name}`.trim())
    .join(", ");
  const stepLines = recipe.steps?.map((s) => s.text).join(" ");

  return `You are a cooking assistant for a recipe app. Rewrite the recipe below so it fully satisfies this constraint: "${constraint}". Actually change ingredients, quantities, and steps as needed to satisfy it — don't just add a disclaimer. Keep it recognizably the same dish where that's still possible.

Original recipe: ${recipe.title}
${recipe.cuisine ? `Cuisine: ${recipe.cuisine}` : ""}
Original ingredients: ${ingredientLines}
Original steps: ${stepLines}

Return a new recipe title reflecting the change (e.g. "Vegan ${recipe.title}"), servings, the likely main protein/sauce/garnish (short phrases, empty string if not applicable), a full ingredient list with realistic quantities and units, and clear step-by-step instructions. Give a timerMinutes value on any step that involves waiting (cooking, simmering, baking, resting) and omit it otherwise.`;
}

// recipe: an existing recipe (title, cuisine?, ingredients, steps); constraint: e.g. "vegan", "spicier"
export async function remixRecipe(recipe, constraint) {
  return callGeminiForRecipe(buildRemixPrompt(recipe, constraint), recipe.cuisine);
}

const SUBSTITUTE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    substitute: { type: "STRING" },
    amount: { type: "STRING" },
    note: { type: "STRING" },
  },
  required: ["substitute", "amount", "note"],
};

function buildSubstitutePrompt(recipe, ingredient) {
  const otherIngredients = recipe.ingredients
    ?.filter((i) => i.name !== ingredient.name)
    .map((i) => i.name)
    .join(", ");

  return `You are a cooking assistant helping someone mid-recipe who doesn't have an ingredient on hand.

Recipe: ${recipe.title}
${recipe.cuisine ? `Cuisine: ${recipe.cuisine}` : ""}
Other ingredients already in the recipe: ${otherIngredients || "none listed"}

Missing ingredient: ${[ingredient.quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ")}

Suggest ONE practical, commonly available substitute for just this ingredient that keeps the dish recognizably the same. Give the substitute's name, the amount to use (adjusted if the substitute is stronger/weaker/differently concentrated than the original — empty string if a straight 1:1 swap), and a short note (under 20 words) on any adjustment to technique or flavor to expect. If there's genuinely no reasonable substitute, say so honestly in the substitute field (e.g. "No good substitute — best to skip this ingredient") and explain briefly in the note.`;
}

// recipe: { title, cuisine?, ingredients }; ingredient: { name, quantity?, unit? }
export async function substituteIngredient(recipe, ingredient) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildSubstitutePrompt(recipe, ingredient) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SUBSTITUTE_RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`Gemini substitute request failed (${response.status}):`, body.slice(0, 500));
    if (response.status === 429) {
      throw new Error("We're getting rate-limited by Gemini right now — please try again in a minute.");
    }
    throw new Error("Substitution suggestions are temporarily unavailable. Please try again.");
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

  if (!parsed.substitute || typeof parsed.substitute !== "string") {
    throw new Error("Gemini response was missing a substitute suggestion.");
  }

  return {
    substitute: parsed.substitute.trim(),
    amount: typeof parsed.amount === "string" ? parsed.amount.trim() : "",
    note: typeof parsed.note === "string" ? parsed.note.trim() : "",
  };
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
    classification: normalizeOptionalText(parsed.classification),
    cuisine: typeof parsed.cuisine === "string" && parsed.cuisine.trim() ? parsed.cuisine.trim() : "Unknown",
    region: typeof parsed.region === "string" && parsed.region.trim() ? parsed.region.trim() : "Unknown",
    protein: normalizeOptionalText(parsed.protein),
    sauce: normalizeOptionalText(parsed.sauce),
    garnish: normalizeOptionalText(parsed.garnish),
    preparationTechnique: normalizeOptionalText(parsed.preparationTechnique),
    texture: normalizeOptionalText(parsed.texture),
    visualCharacteristics: normalizeOptionalText(parsed.visualCharacteristics),
    ingredientCombinations: normalizeStringList(parsed.ingredientCombinations, 3),
    confirmedIngredients: normalizeIngredientList(parsed.confirmedIngredients),
    possibleIngredients: normalizeIngredientList(parsed.possibleIngredients),
    clarifyingQuestions: normalizeQuestions(parsed.clarifyingQuestions),
  };
}

const ROAST_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    roast: { type: "STRING" },
  },
  required: ["roast"],
};

function buildRoastPrompt(dishName) {
  return `You are a witty, playful food critic doing a lighthearted "roast" of a home cook's plating, for a fun feature in a cooking app. Look at the photo of "${dishName || "this dish"}" and write ONE short, funny, PG-rated roast line about the presentation, plating, or photo styling — clever and cheeky, never mean-spirited about the person, just gentle food-focused humor. Under 25 words. No hashtags, no emoji, no quotation marks.`;
}

export async function roastDish(imageDataUrl, dishName) {
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
          parts: [{ text: buildRoastPrompt(dishName) }, { inlineData: { mimeType, data } }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ROAST_RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`Gemini roast request failed (${response.status}):`, body.slice(0, 500));
    if (response.status === 429) {
      throw new Error("We're getting rate-limited by Gemini right now — please try again in a minute.");
    }
    throw new Error("Roasting is temporarily unavailable. Please try again.");
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

  if (!parsed.roast || typeof parsed.roast !== "string") {
    throw new Error("Gemini response was missing a roast.");
  }

  return parsed.roast.trim();
}
