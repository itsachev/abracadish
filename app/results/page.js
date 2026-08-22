"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import LocationPrompt from "@/components/LocationPrompt";
import SaveScanButton from "@/components/SaveScanButton";

const PHOTO_KEY = "abracadish:lastPhoto";

function subscribeNoop() {
  return () => {};
}

function getPhotoSnapshot() {
  return sessionStorage.getItem(PHOTO_KEY);
}

function getPhotoServerSnapshot() {
  return null;
}

function isNotADish(dish) {
  return dish.confidence === 0 && dish.confirmedIngredients.length === 0;
}

export default function ResultsPage() {
  const router = useRouter();
  // useSyncExternalStore (not a useState lazy initializer) so the server
  // render and the client's first render both see null — reading
  // sessionStorage directly in an initializer would let the client's first
  // pass see the real value already, causing a hydration mismatch.
  const photo = useSyncExternalStore(subscribeNoop, getPhotoSnapshot, getPhotoServerSnapshot);
  const [dish, setDish] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    if (!photo) {
      router.replace("/scan");
    }
  }, [photo, router]);

  useEffect(() => {
    if (!photo) return;

    let cancelled = false;

    fetch("/api/recognize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: photo }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Recognition failed.");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setDish(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Something went wrong.");
      });

    return () => {
      cancelled = true;
    };
  }, [photo]);

  if (!photo) return null;

  const analyzing = !dish && !error;

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="Captured dish" className="h-56 w-full object-cover" />
        <button
          type="button"
          onClick={() => router.push("/scan")}
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <path
              d="M4 4v5h5M20 20v-5h-5M4.5 15a8 8 0 0 0 14.5 3.5M19.5 9A8 8 0 0 0 5 5.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Retake
        </button>
      </div>

      {analyzing && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted">Analyzing your photo…</p>
        </div>
      )}

      {error && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/scan")}
            className="gradient-accent rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            Try another photo
          </button>
        </div>
      )}

      {dish && isNotADish(dish) && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{dish.name}</h1>
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-semibold text-muted">
              {Math.round(dish.confidence * 100)}% confidence
            </span>
          </div>
          <p className="mt-4 text-sm text-muted">
            We couldn&apos;t recognize a dish in this photo. Try a clearer photo of your food.
          </p>
          <button
            type="button"
            onClick={() => router.push("/scan")}
            className="gradient-accent mt-5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            Try another photo
          </button>
        </div>
      )}

      {dish && !isNotADish(dish) && (
        <>
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{dish.name}</h1>
              <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                {Math.round(dish.confidence * 100)}% confidence
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {dish.cuisine} · {dish.region}
            </p>
          </div>

          <section className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              What we see
            </h2>

            <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.9" />
                <path
                  d="M8 12.5l2.5 2.5L16 9.5"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Confirmed
            </div>
            <div className="mt-2 space-y-2">
              {dish.confirmedIngredients.map((ingredient) => (
                <div
                  key={ingredient.name}
                  className="flex items-center justify-between rounded-2xl bg-emerald-400/10 px-4 py-3.5 text-sm"
                >
                  <span className="text-foreground/90">{ingredient.name}</span>
                  <span className="font-mono text-xs text-muted">{Math.round(ingredient.confidence * 100)}%</span>
                </div>
              ))}
            </div>

            {dish.possibleIngredients.length > 0 && (
              <>
                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-amber-400">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <circle
                      cx="12"
                      cy="12"
                      r="9.5"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeDasharray="2.2 3"
                    />
                    <path
                      d="M9.6 9.6c.3-1 1.2-1.7 2.4-1.7 1.3 0 2.4.9 2.4 2.1 0 1.6-2.4 1.7-2.4 3.4"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="16.6" r="0.9" fill="currentColor" />
                  </svg>
                  Likely
                </div>
                <div className="mt-2 space-y-2">
                  {dish.possibleIngredients.map((ingredient) => (
                    <div
                      key={ingredient.name}
                      className="flex items-center justify-between rounded-2xl bg-amber-400/10 px-4 py-3.5 text-sm"
                    >
                      <span className="text-foreground/90">{ingredient.name}</span>
                      <span className="font-mono text-xs text-muted">{Math.round(ingredient.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {dish.clarifyingQuestions.length > 0 && (
            <section className="mt-6 rounded-2xl border border-border bg-surface p-4 backdrop-blur-sm">
              <h2 className="text-sm font-semibold text-foreground">
                A couple quick questions
              </h2>
              <p className="text-xs text-muted">Helps us pin down the dish more precisely.</p>
              <div className="mt-3 space-y-4">
                {dish.clarifyingQuestions.map((q) => (
                  <div key={q.id}>
                    <p className="text-sm text-foreground/90">{q.question}</p>
                    <div className="mt-2 flex gap-2">
                      {q.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: option }))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            answers[q.id] === option
                              ? "border-accent/50 bg-accent-soft text-accent"
                              : "border-border text-muted"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <LocationPrompt restaurantName={restaurantName} onRestaurantNameChange={setRestaurantName} />

          <SaveScanButton dish={dish} answers={answers} restaurantName={restaurantName} photo={photo} />
        </>
      )}
    </div>
  );
}
