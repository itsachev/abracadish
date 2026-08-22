# Abracadish — Progress Log

Running record of what's been built, in order. Newest entry at the bottom.

## 1. Project scaffold

- Scaffolded Next.js (App Router, JavaScript, Tailwind CSS v4, ESLint) at the repo root via `create-next-app`.
- Kept `app_idea.md` and `CLAUDE.md` intact; renamed the package to `abracadish`.

## 2. PWA setup

- `app/manifest.js` — installable web app manifest (name, icons, standalone display, theme colors).
- `public/icons/` — generated `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png` (a simple bitten-plate mark, hand-encoded as raw PNGs, no external asset tools needed).
- `public/sw.js` + `components/ServiceWorkerRegister.js` — minimal service worker caching the app shell, registered client-side.
- `app/layout.js` — PWA metadata (icons, `appleWebApp`, manifest link) and `viewport.themeColor`.

## 3. Core click-through flow (mock data, no backend yet)

Built against the DishObservation / Recipe schemas described in `app_idea.md`, backed by `lib/mockData.js` (one mock dish — Chicken Tikka Masala — with 3 ranked mock recipes).

- `/` — home screen: hero, "Scan a dish" CTA, 4-step how-it-works list.
- `/scan` — full-screen camera capture (`components/CameraCapture.js`) using `getUserMedia`, with a gallery/file-input fallback when camera access is denied or unavailable. Captured photo is handed to `/results` via `sessionStorage`.
- `/results` — simulated recognition: loading spinner, dish name + confidence, confirmed/possible ingredient lists, optional clarifying questions (tap-to-answer chips), and a ranked list of matching recipes with match-score bars.
- `/recipe/[id]` — recipe detail: match badge (official/likely/similar/AI-generated), "why this matches" reasons, ingredient list with quantities, source/provenance line, Save button, "Start Cooking" CTA.
- `/cook/[id]` — step-by-step cooking mode (`components/CookingMode.js`) with progress bar, Back/Next navigation, and a working per-step countdown timer.
- `/saved` — saved recipes list, backed by `localStorage` (`lib/savedRecipes.js`), read via `useSyncExternalStore` for cross-tab/cross-component sync.
- `components/BottomNav.js` / `components/AppChrome.js` — bottom tab navigation (Home/Scan/Saved), hidden on full-bleed routes (`/scan`, `/cook/*`).

Verified with `npm run build` and `npm run lint` (both clean) after every step; dev server smoke-tested by curling all routes.

## 4. Dark theme redesign

- Replaced the light/system theme with a single fixed dark design system (`app/globals.css`): near-black background, glass surfaces (`bg-surface` + `backdrop-blur`), an orange→pink gradient accent (`--accent` → `--accent-2`) used for gradient text, primary buttons, and glow shadows.
- Reworked every page and shared component (home, results, recipe detail, cooking mode, saved, bottom nav, recipe card, match badge, confidence bar, save button, camera capture) onto the new dark palette.
- Updated `app/manifest.js` and `viewport.themeColor` to dark (`#08080a`) so the installed PWA's splash screen and browser chrome match.

## 5. Frontend gap fixes

- **Photo size safety**: `CameraCapture` now downscales every captured/uploaded photo to a max 1280px edge (JPEG quality 0.82) before storing it, instead of storing the raw camera-resolution frame — avoids blowing past `sessionStorage`'s ~5–10MB quota on real device photos. A gallery upload now decodes via `createImageBitmap` and is drawn through the same resize path as a live capture. `sessionStorage.setItem` is wrapped in try/catch with a dismissible on-screen notice as a fallback, kept separate from the camera-permission error state so a bad file doesn't kill an otherwise-working camera preview.
- **Retake / re-scan affordance**: `/results` now has a "Retake" button overlaid on the captured photo (back to `/scan`); `/recipe/[id]` has a "Scan another dish" link, closing the dead end that previously required the browser back button or bottom nav.

## 6. Gemini dish recognition (live)

- `lib/gemini.js` — server-only module calling the Gemini Developer API (`gemini-3.5-flash`, current cost-effective vision/free-tier model — 2.5 Flash is being deprecated in Oct 2026) with a `responseSchema` to force structured JSON output (dish name, confidence, cuisine, region, confirmed/possible ingredients, 0–2 clarifying questions), plus server-side validation/clamping of the parsed result before it's ever sent to the client (per `app_idea.md`'s "validate model output before displaying it" principle).
- `app/api/recognize/route.js` — Next.js Route Handler: validates the incoming image data URL, calls `recognizeDish`, returns normalized JSON or a typed error response.
- `/results` now POSTs the captured photo to `/api/recognize` instead of using a hardcoded mock dish, with real loading/error states (an error shows a "Try another photo" retry).
- `lib/mockData.js` — dropped the now-unused static `DISHES` mock; kept the recipe mock DB (still just one seeded family, `chicken-tikka-masala`) and added `slugifyDishName()` to match the AI's recognized dish name against it. Recognizing anything else now shows an honest "we don't have recipes for this yet" empty state rather than mismatched results — recipe retrieval is still mocked pending the real Supabase + pgvector engine.
- `.env.local` (git-ignored) holds `GEMINI_API_KEY` plus Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) provided by the user, ready for the next step; `.env.example` documents the required variables without values.
- Verified end-to-end with a real request against the live Gemini API (structured JSON schema response confirmed working, including honest low-confidence output on a non-food test image).

## 7. Supabase + pgvector recipe retrieval (live)

- `supabase/schema.sql` — migration (run manually by the user in the Supabase SQL Editor, per their choice to keep DB credentials out of automated tooling): enables `pgvector`, creates the `recipes` table, enables RLS with a public-read policy, and defines `match_recipes()`, a cosine-similarity search function granted to `anon`/`authenticated`.
- `lib/supabaseClient.js` — shared Supabase client using the anon/publishable key (safe for both server and client code; reads are gated entirely by the RLS policy).
- `lib/embeddings.js` — Gemini `gemini-embedding-001` text embeddings (768 dimensions via `outputDimensionality`), server-only.
- `lib/recipeMatch.js` — shared, secret-free helpers: builds the text that gets embedded (for both recipes and the recognized-dish query), and `computeMatchReasons()`, which derives "why this matches" bullets by comparing the recognized dish's cuisine/protein/ingredients against a candidate recipe's structured fields — real structured comparison, not static copy.
- `lib/recipes.js` — `getRecipeById` / `getRecipesByIds`, reading from Supabase and normalizing column names back to the shape the UI expects.
- `scripts/seed-recipes.mjs` — one-off script (uses `SUPABASE_SERVICE_ROLE_KEY` directly, run manually, never imported by app code) that embeds and upserts the 3 starter recipes (previously hardcoded in the now-deleted `lib/mockData.js`) into Supabase. Run successfully; all 3 rows seeded with real embeddings.
- `app/api/match-recipes/route.js` — new route: embeds the recognized dish, calls `match_recipes` via RPC, filters out anything below a 0.65 cosine-similarity threshold (so an unrelated dish returns zero matches instead of forcing the nearest neighbor through — verified with a "Greek Salad" query returning `{recipes: []}` while "Chicken Tikka Masala" correctly returns all 3 seeded recipes ranked 0.82 / 0.79 / 0.73), and attaches computed match reasons.
- `/results` now does two sequential live calls — `/api/recognize` then `/api/match-recipes` — with independent loading/error states for each stage.
- `/recipe/[id]` and `/cook/[id]` now fetch the recipe from Supabase (server-side) instead of a mock lookup. Since match score/reasons are query-time results (not stored on the recipe row), `RecipeCard` now carries them to the detail page via URL search params (`?score=...&reasons=...`) rather than re-running retrieval there; visiting a recipe directly (e.g. from Saved) just omits that section.
- `/saved` now fetches full recipe rows from Supabase by id (via the anon client, client-side) instead of a mock lookup.
- `package.json` marked `"type": "module"` (no CommonJS anywhere in the codebase) to let the seed script's ESM imports resolve cleanly.
- Verified against the live database: real end-to-end request/response for both recognition and matching, confirmed correct ranking and correct rejection of an unrelated dish.

## 8. Recipe data sourcing — decision: deferred

Investigated licensed recipe APIs to grow the catalog beyond the 3 hand-authored seed recipes (per `app_idea.md`'s explicit warning against scraping copyrighted recipe sites). Findings: no mainstream option is both genuinely free and viable for a real commercial app —
- **TheMealDB**'s free test key explicitly disallows public/app-store release; commercial rights require a $2/month "supporter" upgrade.
- **Spoonacular**'s free tier's terms don't explicitly ban commercial use, but caps at 50 points/day (not enough volume to seed or serve a real catalog), and its data storage/caching terms may conflict with permanently storing recipes + embeddings in Supabase the way we do now.

Decision: skip recipe API integration for now. The catalog stays at the 3 hand-authored recipes seeded in `scripts/seed-recipes.mjs` until this is revisited.

## 9. Removed recipe matching from the scan flow

Also reviewed the reference design artifact ("Abracadish Flow", linked in CLAUDE.md) for the first time — it uses a different visual language than what's built (warm terracotta dark palette, Instrument Serif display font, three-tier confidence coloring, Bulgarian-first placeholder content) and a Bulgarian-first regional focus. Decision: keep the current visual design as-is for now; not redesigning to match it.

With recipe sourcing deferred (see above), showing "Recipe match" results built on only 3 hardcoded recipes was misleading for anything else photographed. Scoped the removal to just the `/results` page: it now stops after dish recognition (name, confidence, ingredients, clarifying questions) and no longer calls `/api/match-recipes` or renders `RecipeCard`/`ConfidenceBar`. Left everything else intact for later: the `/api/match-recipes` route, `/recipe/[id]`, `/cook/[id]`, `/saved`, and the full Supabase/pgvector/embeddings backend — none of it was deleted, it's just not reachable from the scan flow right now.

## 10. Restyled the ingredients section on /results

Restyled "Confirmed"/"Likely" ingredients as tinted pill rows with tier-colored icons (green checkmark-circle for Confirmed, amber dashed-circle for Likely) under a single "What we see" label, replacing the plain bulleted lists — borrowed the icon/pill treatment from the Recognition screen in the reference design artifact, but kept the app's existing dark neutral palette and Geist font rather than adopting the artifact's warm terracotta/serif look (per the earlier "keep it as it is for now" decision).

## 11. Fixed a hydration-mismatch bug on /results

`/results` used `useState(() => typeof window === "undefined" ? null : sessionStorage.getItem(PHOTO_KEY))` to read the captured photo. That's a real bug on any real reload/navigation: the server render always sees `null` (no `window`), but the client's very first render (before hydration reconciles) reads the real value already sitting in `sessionStorage` from `/scan` — server and client disagreeing on the first render is exactly what React's hydration mismatch error is warning about. Fixed by switching to `useSyncExternalStore` (same pattern already used in `SaveButton`/`saved` for localStorage) with a `getServerSnapshot` that always returns `null`, so server and client agree on the first pass; the real value then arrives via the store's normal client-side read, no extra effect or state needed.

## 12. Stopped leaking raw API errors to the UI

Hit a real Gemini 429 ("You exceeded your current quota") while testing photo upload — the error path itself worked (loading → error state → retry button), but it displayed the raw Gemini error JSON straight to the user. `lib/gemini.js` and `lib/embeddings.js` now log the full upstream error server-side and throw a clean, specific message instead (a friendly rate-limit notice for 429s, a generic "temporarily unavailable" otherwise) — nothing from the raw API response reaches the client.

## 13. Switched recognition to gemini-3.5-flash-lite

Hit a 429 quota-exceeded error on `gemini-3.5-flash` from testing volume. Free-tier quotas are per-model, not shared account-wide, so switched `lib/gemini.js` to `gemini-3.5-flash-lite` — a separate quota bucket, still free-tier, trades some accuracy for being Google's cheapest/highest-throughput current-gen model. Verified working end-to-end against the live API and through `/api/recognize`.

## 14. Restaurant Mode Phase 1 — optional location capture

Implemented the staged approach discussed for `app_idea.md`'s "Restaurant Mode" (section 9), UI/UX-first before any Maps/Places billing setup:

- `lib/exifLocation.js` — reads GPS EXIF from an uploaded photo's original `File` *before* `CameraCapture` redraws it onto a canvas (which strips all metadata). Uses the `exifr` library rather than hand-rolling EXIF parsing, since silently mis-parsed GPS coordinates would be a real (privacy-sensitive) correctness risk. Verified the import/invocation path works (`exifr`'s `gps()` lives on its default export); the no-GPS case returns `undefined` as expected. Couldn't verify the positive case — no real GPS-tagged test photo was available in this environment — so that path needs a real-device check.
- `lib/scanLocation.js` / `lib/locationPreference.js` — sessionStorage for the current scan's location, localStorage for "user declined geolocation once, don't ask again."
- `components/LocationPrompt.js` — renders on `/results` below the clarifying questions: an optional restaurant-name text field, always available; if EXIF already found a location, shows a quiet "Location detected from photo" confirmation instead of asking anything; otherwise shows a single "Add location" chip that requests browser geolocation only when tapped (no cold permission prompt on page load) and remembers a real permission denial so it stops asking. Reads both storages via `useSyncExternalStore`, following the same hydration-safe pattern established for the photo/saved-recipes reads.
- Live camera captures clear any stale location from a previous scan (a canvas-drawn video frame never has EXIF).

This only captures the data — there's still no backend to persist scans to, so the restaurant name/location currently just lives in page state for this one view. It becomes useful once scan history exists and/or Places API (Phase 2, requires a Google Cloud billing account) is wired in to turn coordinates into an actual restaurant match + map pin.

## 15. Fixed an infinite-render loop on /results (LocationPrompt)

`lib/scanLocation.js`'s `readScanLocation()` (used as `LocationPrompt`'s `useSyncExternalStore` snapshot) called `JSON.parse` on every invocation, returning a brand-new object reference each time even when the underlying data hadn't changed — `useSyncExternalStore` requires a stable reference when nothing changed, or it re-renders forever ("Maximum update depth exceeded"). Fixed with the same cached-reference guard already used in `lib/savedRecipes.js`'s `getSavedIdsSnapshot`, which was itself the safe reference I should have copied the first time. Checked for the same pattern elsewhere — `savedRecipes.js` already has the guard, and the one other `JSON.parse` in the codebase (`lib/gemini.js`) isn't a snapshot function, so this was the only instance.

## 16. Supabase email/password auth

Added user accounts ahead of scan history, per the user's request. Email + password, chosen over magic link or Google sign-in for zero extra external setup (no OAuth client, no SMTP dependency for the core flow).

- `lib/supabaseClient.js` — enabled `persistSession`/`autoRefreshToken`/`detectSessionInUrl` on the shared client so it can drive auth from client components. Harmless for its existing server-side callers (`lib/recipes.js`) since there's no `window` there to persist to.
- `components/Header.js` — new sticky top header (shown on every page except the full-bleed `/scan` and `/cook` routes, same exclusion list as the bottom nav): brand link, plus Sign in/Sign up links when signed out or the user's email + Sign out when signed in. Auth state starts `undefined` (session check is inherently async) so server and client's first render agree — no hydration risk here, unlike the earlier sessionStorage cases.
- `app/login/page.js`, `app/signup/page.js` — plain email/password forms calling `supabase.auth.signInWithPassword` / `signUp` directly (no server route needed, this goes straight to Supabase Auth from the client). Signup branches on whether a session comes back immediately vs. requires email confirmation (project-setting-dependent — showed a "check your email" state for the latter).
- Verified end-to-end against the live project: signup, sign-in, and sign-out all round-tripped correctly. This project currently has email confirmation off, so signup logs a user in immediately.

Not yet done: no route protection/redirects (any page is reachable regardless of auth state — nothing needs it yet), and the scan-history feature this was built for isn't wired up yet (no `scans` table, no "Save scan" action).

## 17. Reverse geocoding + Save scan action

- `lib/reverseGeocode.js` / `app/api/reverse-geocode/route.js` — resolves lat/lng to a "City, Country" label via OpenStreetMap's Nominatim (free, no API key, no billing setup — unlike Google's Places/Maps path). Verified end-to-end: `{lat: 42.6977, lng: 23.3219}` → `"Sofia, Bulgaria"`. Flagged for later: Nominatim's usage policy expects a descriptive User-Agent and reasonable request volume; worth revisiting with a paid provider if usage grows past what's reasonable for a free shared service.
- `LocationPrompt` now resolves and shows the real place name ("Sofia, Bulgaria") instead of the generic "Location added", and persists the resolved label back into the stored location so other components (the save action) can read it too.
- `lib/useAuthUser.js` — extracted the auth-state hook out of `Header` so `SaveScanButton` can use the same logic without duplicating it.
- `components/SaveScanButton.js` — new "Save this scan" action below the location card: signed out shows a "Sign in to save this scan" hint (linking to `/login`) instead of a working button; signed in, it inserts the dish name/confidence/cuisine/ingredients/clarifying-question answers/restaurant name/location into a new `scans` table, with saving/saved/error states.
- `supabase/schema_scans.sql` — new migration (user to run, same pattern as `schema.sql`): `scans` table with RLS restricting each user to their own rows (`auth.uid() = user_id`) for select/insert/delete.

## Not started yet

- Actual photo upload to persistent storage (photos currently stay client-side in `sessionStorage`, sent to the recognition API but not saved anywhere server-side).
- Growing the recipe catalog beyond the 3 seeded chicken-tikka-masala-family recipes (everything else currently returns "no recipes yet").
- Retuning the 0.65 similarity threshold once there's a larger, more varied catalog to calibrate against.
- Capacitor wrapping for Android/iOS distribution (planned per earlier discussion, not started).
