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

## Not started yet

- Real Gemini-powered dish recognition, ingredient inference, and recipe embeddings (currently all mocked in `lib/mockData.js`).
- Supabase (Postgres + pgvector) integration for structured recipes and recipe retrieval/ranking.
- Actual photo upload to a backend (photos currently stay client-side in `sessionStorage`).
- Capacitor wrapping for Android/iOS distribution (planned per earlier discussion, not started).
