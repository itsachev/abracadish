"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOrGenerateRecipeIdForScan } from "@/lib/cookScan";

const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

export default function ScanCard({ scan, onDelete }) {
  const router = useRouter();
  const cardRef = useRef(null);
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
    if (!cookError) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [cookError]);

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await onDelete(scan.id);
    } catch {
      setDeleting(false);
    }
  }

  async function handleCook() {
    setCooking(true);
    setCookError(null);
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    try {
      const recipeId = await getOrGenerateRecipeIdForScan(scan);
      router.push(`/recipe/${recipeId}`);
    } catch (error) {
      setCooking(false);
      setCookError(error.message || "Couldn't generate a recipe.");
    }
  }

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl border border-border bg-surface p-4 backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-surface-hover"
    >
      <Link href={`/scans/${scan.id}`} className="absolute inset-0 rounded-2xl" aria-label={scan.dishName} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {scan.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={scan.imageUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/5 text-muted">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{scan.dishName}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {scan.cuisine} · {scan.region}
            </p>
            {(scan.restaurantName || scan.locationLabel) && (
              <p className="mt-0.5 truncate text-xs text-muted">
                {[scan.restaurantName, scan.locationLabel].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {confirming ? (
          <div className="relative z-10 flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-start gap-2">
            <div className="text-right">
              {typeof scan.confidence === "number" && (
                <div className="font-mono text-sm font-bold text-foreground/90">
                  {Math.round(scan.confidence * 100)}%
                </div>
              )}
              <div className="text-xs text-muted">{dateFormatter.format(new Date(scan.createdAt))}</div>
            </div>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Delete scan"
              className="relative z-10 rounded-full p-1.5 text-red-400 transition-colors hover:bg-red-400/10"
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
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10 mt-3 border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={handleCook}
          disabled={cooking}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-accent-soft py-2 text-xs font-semibold text-accent transition-opacity disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <path
              d="M12 3.5c1.5 2.2.5 3.5-.3 4.6-.9 1.2-1.2 2.4-.3 3.7 1-.3 1.6-1 1.8-1.8.9 1 1.3 2.3.8 3.7a4 4 0 1 1-6.8-3.9c.7-1 2-2.1 1.8-4.1 1 .3 1.6 1 1.8 1.9.4-1.3.3-2.7-1-4.1.8-.2 1.6-.2 2.2 0Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {cooking ? "Finding a recipe…" : "Cook this dish"}
        </button>
        {cookError && <p className="mt-1.5 text-center text-xs text-red-400">{cookError}</p>}
      </div>
    </div>
  );
}
