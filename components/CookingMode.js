"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/trackEvent";
import { markRecipeCooked } from "@/lib/cookedRecipes";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CookingMode({ recipe }) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [timerStepIndex, setTimerStepIndex] = useState(stepIndex);

  const step = recipe.steps[stepIndex];
  const isLastStep = stepIndex === recipe.steps.length - 1;

  useEffect(() => {
    trackEvent("cooking_started", {
      recipeId: recipe.id,
      dishName: recipe.title,
      stepCount: recipe.steps.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (timerStepIndex !== stepIndex) {
    setTimerStepIndex(stepIndex);
    setSecondsLeft(null);
  }

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  function goNext() {
    if (isLastStep) {
      trackEvent("cooking_completed", { recipeId: recipe.id, dishName: recipe.title });
      markRecipeCooked(recipe.id);
      router.push(`/cook/${recipe.id}/done`);
      return;
    }
    setStepIndex((i) => Math.min(i + 1, recipe.steps.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full opacity-30 blur-[100px]"
        style={{
          backgroundImage:
            "radial-gradient(closest-side, var(--accent), var(--accent-2), transparent)",
        }}
      />

      <div className="relative flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button
          type="button"
          onClick={() => router.push(`/recipe/${recipe.id}`)}
          aria-label="Exit cooking mode"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-mono text-sm font-medium text-muted">
          Step {stepIndex + 1} of {recipe.steps.length}
        </span>
        <div className="h-9 w-9" />
      </div>

      <div className="relative px-5 pt-4">
        <div className="h-1.5 w-full rounded-full bg-black/8">
          <div
            className="gradient-accent h-1.5 rounded-full transition-all"
            style={{ width: `${((stepIndex + 1) / recipe.steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-accent">
          Step {stepIndex + 1}
        </span>
        <p className="mt-3 text-2xl font-semibold leading-snug text-foreground">
          {step.text}
        </p>

        {step.timerMinutes ? (
          <button
            type="button"
            onClick={() => setSecondsLeft(step.timerMinutes * 60)}
            className="mt-6 flex items-center gap-2 rounded-full border border-accent/40 bg-accent-soft px-5 py-2.5 font-mono text-sm font-semibold text-accent"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {secondsLeft === null
              ? `Start Timer (${step.timerMinutes} min)`
              : formatTime(secondsLeft)}
          </button>
        ) : null}
      </div>

      <div className="relative flex gap-3 px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-3xl border border-border py-3.5 text-base font-semibold text-muted disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          className="gradient-accent glow-accent flex flex-1 items-center justify-center gap-1.5 rounded-3xl py-3.5 text-base font-semibold text-white transition-transform active:scale-[0.98]"
        >
          {isLastStep ? (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {isLastStep ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
