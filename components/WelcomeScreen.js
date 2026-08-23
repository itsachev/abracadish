"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/onboarding";

function subscribeNoop() {
  return () => {};
}

// Defaults to "already seen" on the server and on the client's first paint,
// so there's no hydration mismatch — the real localStorage value (if it
// says otherwise) kicks in a render later, same pattern as the "declined
// location" flag on LocationPrompt.
function getServerSnapshotSeen() {
  return true;
}

const STEPS = [
  {
    emoji: "📸",
    title: "Snap it",
    desc: "Point your camera at any dish — yours, a friend's, or that suspicious leftover in the fridge.",
  },
  {
    emoji: "🔮",
    title: "We name that dish",
    desc: "Our AI squints really hard and tells you what it probably is — with an honest confidence score, not fake certainty.",
  },
  {
    emoji: "📖",
    title: "We hunt down the recipe",
    desc: "Real recipes, ranked by how closely they match. No robot just making things up on the spot (usually).",
  },
  {
    emoji: "👩‍🍳",
    title: "Cook it",
    desc: "Step-by-step, one instruction at a time. No mystery \"season to taste.\"",
  },
];

export default function WelcomeScreen() {
  const seen = useSyncExternalStore(subscribeNoop, hasSeenOnboarding, getServerSnapshotSeen);
  const [dismissed, setDismissed] = useState(false);
  const visible = !seen && !dismissed;

  // Locks background scrolling to just this overlay while it's up, restoring
  // the page's own overflow once it's dismissed or was never shown.
  useEffect(() => {
    if (!visible) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [visible]);

  if (!visible) return null;

  function handleDismiss() {
    markOnboardingSeen();
    setDismissed(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background px-6 pb-8 pt-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
        style={{
          backgroundImage: "radial-gradient(closest-side, var(--accent), var(--accent-2), transparent)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col">
        <h1 className="font-display text-4xl font-normal leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          Welcome to Abraca<span className="gradient-text">dish</span>
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Say the magic word. Point your camera at food. We&apos;ll do the rest —
          minus the wand, plus an AI that actually admits when it&apos;s guessing.
        </p>

        <ul className="mt-8 space-y-3">
          {STEPS.map((step) => (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 backdrop-blur-sm"
            >
              <span className="text-2xl" aria-hidden>
                {step.emoji}
              </span>
              <div>
                <p className="font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-xs text-muted">
          No magic wand required. Mild hunger recommended.
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          className="gradient-accent glow-accent mt-4 flex items-center justify-center gap-2 rounded-2xl py-4 text-center text-base font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M12 3.5c1.5 2.2.5 3.5-.3 4.6-.9 1.2-1.2 2.4-.3 3.7 1-.3 1.6-1 1.8-1.8.9 1 1.3 2.3.8 3.7a4 4 0 1 1-6.8-3.9c.7-1 2-2.1 1.8-4.1 1 .3 1.6 1 1.8 1.9.4-1.3.3-2.7-1-4.1.8-.2 1.6-.2 2.2 0Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Let&apos;s cook
        </button>
      </div>
    </div>
  );
}
