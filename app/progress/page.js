"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/useAuthUser";
import { getScansForUser } from "@/lib/scans";
import { computeStreak, computeCuisineBadges, computeWeeklyRecap } from "@/lib/scanStats";

export default function ProgressPage() {
  const user = useAuthUser();
  const [scans, setScans] = useState(null);

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
          to track your scan streak and cuisines explored.
        </p>
      </div>
    );
  }

  const { current, longest } = computeStreak(scans);
  const badges = computeCuisineBadges(scans);
  const { scansThisWeek, cuisinesThisWeek } = computeWeeklyRecap(scans);

  if (scans.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 pt-10 text-center">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Your progress</h1>
        <p className="mt-3 text-sm text-muted">Scan your first dish to start building a streak.</p>
        <Link
          href="/scan"
          className="gradient-accent mt-5 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        >
          Scan a dish
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-6">
      <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">Your progress</h1>

      <section className="mt-5 rounded-2xl border border-accent/30 bg-accent-soft p-5 text-center">
        <div className="text-5xl">🔥</div>
        <div className="gradient-text mt-2 font-mono text-4xl font-bold">{current}</div>
        <p className="text-sm font-medium text-foreground/90">
          day{current === 1 ? "" : "s"} streak
        </p>
        {longest > current && (
          <p className="mt-1 text-xs text-muted">Longest streak: {longest} days</p>
        )}
        {current === 0 && (
          <p className="mt-1 text-xs text-muted">Scan a dish today to start a new streak.</p>
        )}
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <div className="font-mono text-2xl font-bold text-foreground">{scans.length}</div>
          <p className="text-xs text-muted">dishes scanned</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <div className="font-mono text-2xl font-bold text-foreground">{badges.length}</div>
          <p className="text-xs text-muted">cuisines explored</p>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">This week</h2>
        <p className="mt-1.5 text-sm text-foreground/90">
          {scansThisWeek === 0
            ? "No scans yet this week."
            : `${scansThisWeek} dish${scansThisWeek === 1 ? "" : "es"} scanned across ${cuisinesThisWeek} cuisine${cuisinesThisWeek === 1 ? "" : "s"}.`}
        </p>
      </section>

      {badges.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Cuisines explored
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map(({ cuisine, count }) => (
              <div
                key={cuisine}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm"
              >
                <span className="text-foreground/90">{cuisine}</span>
                <span className="rounded-full bg-accent-soft px-1.5 py-0.5 font-mono text-xs text-accent">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
