"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/useAuthUser";
import { getScansForUser } from "@/lib/scans";
import { getCatalogCuisines } from "@/lib/recipes";
import { computeCuisinePassport } from "@/lib/scanStats";
import { getCuisineEmoji } from "@/lib/cuisineEmoji";

function formatStampDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Alternates a slight tilt per card so the grid reads as hand-stamped
// rather than a plain uniform grid — purely decorative.
function stampTilt(index) {
  return index % 2 === 0 ? "-2deg" : "2deg";
}

export default function PassportPage() {
  const user = useAuthUser();
  const [scans, setScans] = useState(null);
  const [catalogCuisines, setCatalogCuisines] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getScansForUser(user.id)
      .then((data) => {
        if (!cancelled) setScans(data);
      })
      .catch(() => {
        if (!cancelled) setScans([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    getCatalogCuisines()
      .then((cuisines) => {
        if (!cancelled) setCatalogCuisines(cuisines);
      })
      .catch(() => {
        if (!cancelled) setCatalogCuisines([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (user === undefined || (user && scans === null)) {
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
          to start your dish passport.
        </p>
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 pt-10 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Your dish passport</h1>
        <p className="mt-3 text-sm text-muted">Scan your first dish to earn your first stamp.</p>
        <Link
          href="/scan"
          className="gradient-accent mt-5 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="2" />
          </svg>
          Scan a dish
        </Link>
      </div>
    );
  }

  const passport = computeCuisinePassport(scans);
  const discovered = new Set(passport.map((p) => p.cuisine.toLowerCase()));
  const toDiscover = catalogCuisines.filter((c) => !discovered.has(c.toLowerCase()));

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Your dish passport</h1>
      <p className="mt-1 text-sm text-muted">Every cuisine you&apos;ve scanned, stamped and collected.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border bg-surface p-4 text-center">
          <div className="gradient-text font-mono text-2xl font-bold">{passport.length}</div>
          <p className="text-xs text-muted">cuisines unlocked</p>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-4 text-center">
          <div className="font-mono text-2xl font-bold text-foreground">{scans.length}</div>
          <p className="text-xs text-muted">dishes scanned</p>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Stamps collected</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {passport.map((entry, index) => (
            <div
              key={entry.cuisine}
              style={{ transform: `rotate(${stampTilt(index)})` }}
              className="rounded-3xl border-2 border-dashed border-accent/40 bg-accent-soft p-4 text-center"
            >
              <div className="text-4xl">{getCuisineEmoji(entry.cuisine)}</div>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                {entry.cuisine}
              </p>
              <p className="mt-1 font-mono text-xs text-accent">
                ×{entry.count} dish{entry.count === 1 ? "" : "es"}
              </p>
              <p className="mt-1 text-[11px] text-muted">First stamped {formatStampDate(entry.firstScannedAt)}</p>
            </div>
          ))}
        </div>
      </section>

      {toDiscover.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Still to discover</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {toDiscover.map((cuisine, index) => (
              <div
                key={cuisine}
                style={{ transform: `rotate(${stampTilt(index)})` }}
                className="rounded-3xl border-2 border-dashed border-border bg-surface/60 p-4 text-center opacity-60"
              >
                <div className="text-4xl grayscale">🔒</div>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-foreground/80">
                  {cuisine}
                </p>
                <p className="mt-1 text-[11px] text-muted">Not stamped yet</p>
              </div>
            ))}
          </div>
          <Link
            href="/scan"
            className="gradient-accent-soft mt-4 flex w-full items-center justify-center gap-2 rounded-3xl border border-accent/30 py-3.5 text-center text-sm font-semibold text-foreground transition-transform active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            Scan a dish to unlock the next stamp
          </Link>
        </section>
      )}
    </div>
  );
}
