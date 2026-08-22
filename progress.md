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

## Not started yet

- Supabase (Postgres + pgvector) integration for structured recipes and real recipe retrieval/ranking (credentials are in `.env.local`, schema/client code not built yet).
- Actual photo upload to persistent storage (photos currently stay client-side in `sessionStorage`, sent to the recognition API but not saved anywhere server-side).
- Gemini-based recipe embeddings for the retrieval engine.
- Capacitor wrapping for Android/iOS distribution (planned per earlier discussion, not started).
