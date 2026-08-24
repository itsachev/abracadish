"use client";

import Link from "next/link";
import SaveButton from "@/components/SaveButton";

// Fixed set of confetti pieces (left%, delay, duration, rotation, color) —
// hardcoded rather than Math.random() so server and client markup match
// and there's no hydration mismatch for a purely decorative flourish.
const CONFETTI = [
  { left: 4, delay: 0, duration: 2.6, rotate: 20, color: "var(--accent)" },
  { left: 12, delay: 0.3, duration: 3.1, rotate: -35, color: "var(--accent-2)" },
  { left: 20, delay: 0.1, duration: 2.4, rotate: 60, color: "#d97f1e" },
  { left: 28, delay: 0.5, duration: 2.9, rotate: -10, color: "var(--accent)" },
  { left: 36, delay: 0.2, duration: 2.7, rotate: 45, color: "#e85d5d" },
  { left: 44, delay: 0.6, duration: 3.3, rotate: -50, color: "var(--accent-2)" },
  { left: 52, delay: 0, duration: 2.5, rotate: 15, color: "#4a9d6f" },
  { left: 60, delay: 0.4, duration: 3, rotate: -25, color: "var(--accent)" },
  { left: 68, delay: 0.15, duration: 2.8, rotate: 55, color: "#d97f1e" },
  { left: 76, delay: 0.35, duration: 2.6, rotate: -40, color: "var(--accent-2)" },
  { left: 84, delay: 0.05, duration: 3.2, rotate: 30, color: "#e85d5d" },
  { left: 92, delay: 0.5, duration: 2.7, rotate: -15, color: "var(--accent)" },
  { left: 8, delay: 0.7, duration: 3.4, rotate: 40, color: "#4a9d6f" },
  { left: 48, delay: 0.8, duration: 2.9, rotate: -60, color: "#e85d5d" },
  { left: 96, delay: 0.65, duration: 3.1, rotate: 25, color: "var(--accent-2)" },
  { left: 64, delay: 0.9, duration: 2.5, rotate: -30, color: "#d97f1e" },
];

export default function CookingComplete({ recipe }) {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-40 blur-[110px]"
        style={{
          backgroundImage:
            "radial-gradient(closest-side, var(--accent), var(--accent-2), transparent)",
        }}
      />

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {CONFETTI.map((piece, i) => (
          <span
            key={i}
            className="animate-confetti-fall absolute top-0 block h-2.5 w-1.5 rounded-[1px]"
            style={{
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--confetti-rotate": `${piece.rotate}deg`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="animate-badge-pop relative flex h-24 w-24 items-center justify-center">
          <span className="animate-pulse-ring absolute inset-0 rounded-full bg-accent/40" />
          <span className="gradient-accent glow-accent relative flex h-24 w-24 items-center justify-center rounded-full">
            <svg viewBox="0 0 24 24" fill="none" className="h-11 w-11">
              <path
                d="M5 12.5l4.5 4.5L19 7"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <h1 className="animate-rise-in font-display mt-7 text-4xl font-bold leading-[1.1] tracking-tight text-foreground">
          Nicely done!
        </h1>
        <p
          className="animate-rise-in mt-3 text-base text-muted"
          style={{ animationDelay: "0.08s" }}
        >
          You just cooked
          <span className="font-semibold text-foreground"> {recipe.title}</span>. Hope it hit the
          spot.
        </p>

        <div
          className="animate-rise-in mt-8 flex w-full max-w-xs flex-col gap-3"
          style={{ animationDelay: "0.16s" }}
        >
          <Link
            href="/scan"
            className="gradient-accent glow-accent flex items-center justify-center gap-2 rounded-3xl py-3.5 text-center text-base font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="2" />
            </svg>
            Scan another dish
          </Link>

          <div className="flex gap-3">
            <Link
              href={`/recipe/${recipe.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-3xl border border-border py-3 text-sm font-semibold text-foreground"
            >
              Back to recipe
            </Link>
            <SaveButton recipeId={recipe.id} className="flex-1 justify-center py-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
