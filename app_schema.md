# Abracadish — App Schema & Implemented Features

This documents the app **as actually built**, not the aspirational brief (`app_idea.md`). Written 2026-08-25.

## Product statement

> Snap a dish → Recognize it → Find the closest recipe → Cook it.

Retrieval-first, not generation-first: the app tries to match a photographed dish to an
existing recipe in its own catalog (via embeddings) before ever asking an LLM to invent one,
and it's explicit about confidence vs. AI approximation throughout the UI.

## Stack

- **Client**: Next.js 16 (App Router), JavaScript, Tailwind CSS, installable PWA (service worker in `public/sw.js`, manifest via `app/manifest.js`).
- **AI**: Gemini (`gemini-3.5-flash-lite` for vision/recognition/generation/remix/roast, `gemini-embedding-001` for recipe embeddings) — server-side only, called from `lib/gemini.js`.
- **Data**: Supabase Postgres + `pgvector` (recipe similarity search), Supabase Auth (email/password), Supabase Storage (`scan-photos` bucket).
- **Maps**: Google Maps Platform (`@vis.gl/react-google-maps`) — Places Autocomplete + Place Details (Essentials SKU) for restaurant search, Maps JavaScript API for an interactive pin picker.
- **Push**: Web Push (`web-push` npm package + VAPID keys), triggered by a Vercel Cron job.
- **Hosting**: Vercel.

## Primary user flow

1. **Scan** (`/scan`) — camera capture or file upload (`components/CameraCapture.js`), downscaled client-side to a JPEG data URL, held in-memory only (`lib/photoStorage.js`) until the next step.
2. **Recognize** (`/results`) — the photo is POSTed to `/api/recognize`; Gemini returns dish name, confidence, cuisine/region/protein/sauce/garnish/technique/texture, confirmed vs. possible ingredients (each with its own confidence), and up to 2 optional clarifying questions. The UI never presents "possible" ingredients as confirmed facts.
   - Optional: restaurant name search with Google Places Autocomplete + an interactive map pin (`components/RestaurantSearchInput.js`, `components/LocationMapPicker.js`) to tag where the dish was eaten.
   - Optional: "Roast me" (`/api/roast`) — a throwaway, witty one-liner about the plating, for fun, not persisted.
3. **Match** (`/matches`) — `/api/match-recipes` embeds the recognized dish and runs a pgvector cosine-similarity search (`match_recipes` SQL function) against the `recipes` table, keeping only results ≥0.65 similarity. If nothing matches, falls back to AI recipe generation (`/api/generate-recipe`), which is also embedded and saved back into the catalog so it's retrievable for the next similar scan.
4. **Recipe** (`/recipe/[id]`) — ingredients, match reasons, a "Remix this recipe" bar (Vegan/Vegetarian/Gluten-free/Dairy-free/Low-carb/Spicier — each remix is a real Gemini rewrite, cached under a deterministic id so repeats don't re-call the model), save/shopping-list actions, and a "Cooked" pill if this recipe has been cooked before.
5. **Cook** (`/cook/[id]`) — one step at a time, optional per-step timers, progress bar.
6. **Done** (`/cook/[id]/done`) — celebration screen (confetti, badge-pop) with a thumbs up/down recipe rating (logged to `funnel_events`) and next actions (scan another, back to recipe, save).

## Feature inventory

| Area | Where | Notes |
|---|---|---|
| Cooked-recipe tracking | `lib/cookedRecipes.js`, `components/CookedBadge.js`/`CookedMark.js` | localStorage-based; badge/pill shown on recipe cards and the recipe detail page; dedicated `/cooked` list linked from Account. |
| Saved recipes/scans | `lib/savedRecipes.js`, `/saved` | localStorage for recipes, Supabase `scans` table for scan history (signed-in only). |
| Shopping list | `lib/shoppingList.js`, `/shopping-list` | Add ingredients from any recipe, grouped by recipe, check-off + clear. |
| Progress & streaks | `lib/scanStats.js`, `/progress` | Consecutive-day streak (local calendar days), cuisine badges, weekly recap. |
| Dish passport | `/passport` | Cuisine "stamps" collected from scan history. |
| Recipe rating | `components/CookingComplete.js` | Thumbs up/down on the completion screen → `funnel_events` (`recipe_rated`). |
| Streak-reminder push notifications | `lib/streakReminders.js`, `components/StreakReminderToggle.js`, `/api/push/*` | Opt-in toggle (Progress page) → Web Push subscription stored in `push_subscriptions` → Vercel Cron hits `/api/push/send-streak-reminders` daily, notifying users who scanned yesterday but not yet today. |
| Restaurant/location tagging | `components/LocationPrompt.js`, `RestaurantSearchInput.js`, `LocationMapPicker.js` | Google Places search resolves a precise pin; falls back to a plain text field if no Maps API key is configured. |
| Funnel analytics | `lib/trackEvent.js`, `funnel_events` table | `photo_captured` → `dish_recognized` → `matches_viewed` → `recipe_selected` → `cooking_started` → `cooking_completed` → `recipe_rated`. North-star metric per `app_idea.md`: successful cooking sessions per active user. |
| Auth | `/login`, `/signup`, `/api/auth/*` | Supabase email/password, session cookie set server-side (mobile browser reliability workaround). No OAuth/magic links. |
| PWA install | `components/InstallPrompt.js` | Native `beforeinstallprompt` button on Chromium; manual "Add to Home Screen" instructions on iOS Safari (no button — iOS exposes no install API). |
| First-time onboarding | `components/WelcomeScreen.js`, `lib/scanNavHint.js` | 4-step welcome overlay; home page hides the "Scan a dish" CTA for first-time signed-out visitors and instead pulses the bottom nav's Scan tab until tapped. |

## Data model (Supabase)

- `recipes` — structured recipe (title, cuisine, protein, sauce, garnish, servings, ingredients, steps, `embedding vector(768)`, source/provenance including remix lineage). Public read; open insert for AI-generated recipes.
- `scans` — a user's scan history (dish name, confidence, cuisine/region, confirmed/possible ingredients, restaurant name, location, `image_path`). RLS: own rows only.
- `funnel_events` — append-only analytics log (`event_type` CHECK-constrained, `metadata jsonb`). Insert-only from the client; read via the Dashboard SQL editor.
- `push_subscriptions` — one row per browser push subscription (`endpoint`, `p256dh`, `auth`). RLS: own rows only for regular clients; the reminder cron reads across all users via the service-role key.
- Storage: `scan-photos` bucket, public read, RLS-restricted upload/delete to the owning user's folder.

## Recipe matching, concretely

Not a keyword search. `lib/recipeMatch.js` builds a text summary of the recognized dish, embeds it with Gemini, and calls a pgvector `match_recipes` RPC that ranks by cosine similarity. Ingredient/cuisine/protein overlap is computed separately only to generate the human-readable "Why this matches" bullets — it doesn't affect ranking.

## Known simplifications / follow-ups worth knowing about

- Streak-reminder "today/yesterday" boundaries are computed in UTC (no per-user timezone stored), so the cron's targeting is approximate for users far from UTC.
- Recipe ratings are logged as raw events, not yet aggregated/surfaced anywhere in the UI — there isn't enough volume yet for that to be meaningful.
- The hero heading on the home page (`app/page.js`) uses a `flex flex-wrap sm:flex-nowrap` layout tuned to the app's fixed `max-w-md` column; if that column width ever changes, re-verify at narrow (~320-360px) viewports.
