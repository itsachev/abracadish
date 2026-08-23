"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthUser } from "@/lib/useAuthUser";
import { getScanById, deleteScan } from "@/lib/scans";
import { getOrGenerateRecipeIdForScan, scanToDish } from "@/lib/cookScan";
import { storeDish } from "@/lib/dishStorage";

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default function ScanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAuthUser();
  const [scan, setScan] = useState(undefined); // undefined = loading, null = not found
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cooking, setCooking] = useState(false);
  const [cookError, setCookError] = useState(null);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    getScanById(id)
      .then((data) => {
        if (!cancelled) setScan(data);
      })
      .catch(() => {
        if (!cancelled) setScan(null);
      });

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteScan(id);
      router.push("/saved");
    } catch {
      setDeleting(false);
    }
  }

  async function handleCook() {
    setCooking(true);
    setCookError(null);
    try {
      const recipeId = await getOrGenerateRecipeIdForScan(scan);
      router.push(`/recipe/${recipeId}`);
    } catch (error) {
      setCooking(false);
      setCookError(error.message || "Couldn't generate a recipe.");
    }
  }

  function handleGetRecipe() {
    storeDish(scanToDish(scan));
    router.push("/matches");
  }

  if (user === undefined) {
    return (
      <div className="mx-auto max-w-md px-5 pt-6">
        <div className="h-8 w-40 animate-pulse rounded bg-surface" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 pt-10 text-center">
        <p className="text-sm text-muted">
          <Link href="/login" className="text-accent underline">
            Sign in
          </Link>{" "}
          to view your saved scans.
        </p>
      </div>
    );
  }

  if (scan === undefined) {
    return (
      <div className="mx-auto max-w-md px-5 pt-6">
        <div className="h-8 w-40 animate-pulse rounded bg-surface" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="mx-auto max-w-md px-5 pt-10 text-center">
        <p className="text-sm text-muted">This scan couldn&apos;t be found.</p>
        <Link href="/saved" className="mt-3 inline-block text-sm text-accent underline">
          Back to saved
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-6">
      {scan.imageUrl && (
        <div className="overflow-hidden rounded-2xl border border-border bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scan.imageUrl} alt={scan.dishName} className="h-56 w-full object-cover" />
        </div>
      )}

      <div className={`flex items-center justify-between ${scan.imageUrl ? "mt-6" : ""}`}>
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">{scan.dishName}</h1>
        {typeof scan.confidence === "number" && (
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            {Math.round(scan.confidence * 100)}% confidence
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">
        {scan.cuisine} · {scan.region}
      </p>
      <p className="mt-1 text-xs text-muted">
        Saved {dateFormatter.format(new Date(scan.createdAt))}
        {(scan.restaurantName || scan.locationLabel) &&
          ` · ${[scan.restaurantName, scan.locationLabel].filter(Boolean).join(" · ")}`}
      </p>

      {scan.confirmedIngredients.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Confirmed</h2>
          <div className="mt-2 space-y-2">
            {scan.confirmedIngredients.map((ingredient) => (
              <div
                key={ingredient.name}
                className="flex items-center justify-between rounded-2xl bg-emerald-400/10 px-4 py-3.5 text-sm"
              >
                <span className="text-foreground/90">{ingredient.name}</span>
                <span className="font-mono text-xs text-muted">
                  {Math.round(ingredient.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {scan.possibleIngredients.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Likely</h2>
          <div className="mt-2 space-y-2">
            {scan.possibleIngredients.map((ingredient) => (
              <div
                key={ingredient.name}
                className="flex items-center justify-between rounded-2xl bg-amber-400/10 px-4 py-3.5 text-sm"
              >
                <span className="text-foreground/90">{ingredient.name}</span>
                <span className="font-mono text-xs text-muted">
                  {Math.round(ingredient.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={handleGetRecipe}
        className="gradient-accent glow-accent mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold text-white transition-transform active:scale-[0.98]"
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
        Get a recipe
      </button>

      <p className="my-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">OR</p>

      <button
        type="button"
        onClick={handleCook}
        disabled={cooking}
        className="gradient-accent-soft flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/30 py-3.5 text-base font-semibold text-foreground transition-transform active:scale-[0.98] disabled:opacity-70"
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
        {cooking ? "Finding a recipe…" : "Cook me"}
      </button>
      {cookError && <p className="mt-2 text-center text-sm text-red-400">{cookError}</p>}

      {confirming ? (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Confirm delete"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-border py-3 text-sm font-semibold text-red-400 transition-colors hover:border-red-400/40"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.7 12.1A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.9L7 7"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Delete this scan
        </button>
      )}
    </div>
  );
}
