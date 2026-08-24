"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScanCard from "@/components/ScanCard";
import { useAuthUser } from "@/lib/useAuthUser";
import { getScansForUser, deleteScan } from "@/lib/scans";
import { computeStreak } from "@/lib/scanStats";

const STEPS = [
  { title: "Capture", desc: "Snap a photo of any dish." },
  { title: "Recognize", desc: "See the likely dish and ingredients." },
  { title: "Match", desc: "Get the closest real recipes, ranked." },
  { title: "Cook", desc: "Follow a step-by-step cooking mode." },
];

export default function Home() {
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

  async function handleDeleteLastScan(id) {
    await deleteScan(id);
    setScans((prev) => prev.filter((scan) => scan.id !== id));
  }

  const hasActivity = scans && scans.length > 0;

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
        style={{
          backgroundImage:
            "radial-gradient(closest-side, var(--accent), var(--accent-2), transparent)",
        }}
      />

      <div className="relative mx-auto flex max-w-md flex-col px-6 pt-8">
        <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl">
          <span className="block sm:inline">
            <span className="gradient-text">Snap.</span>Identify.
          </span>{" "}
          <span className="block sm:inline">
            <span className="gradient-text">Find.</span>Cook.
          </span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Photograph any dish and discover the closest recipe behind it —
          with confidence you can trust, not AI guesses dressed up as facts.
        </p>

        {hasActivity && (
          <Link
            href="/scan"
            className="gradient-accent glow-accent mt-9 flex items-center justify-center gap-2 rounded-3xl py-4 text-center text-base font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="2" />
            </svg>
            Scan a dish
          </Link>
        )}

        {hasActivity ? (
          <section className="mt-14">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Welcome back
            </h2>

            {(() => {
              const { current } = computeStreak(scans);
              return (
                <p className="mt-2 text-sm text-foreground/90">
                  {current > 0
                    ? `🔥 ${current}-day streak · ${scans.length} dish${scans.length === 1 ? "" : "es"} scanned so far.`
                    : `${scans.length} dish${scans.length === 1 ? "" : "es"} scanned so far — scan today to start a new streak.`}
                </p>
              );
            })()}

            <p className="mt-10 text-xs font-semibold uppercase tracking-wide text-muted">
              Your last scan
            </p>
            <div className="mt-3">
              <ScanCard scan={scans[0]} onDelete={handleDeleteLastScan} />
            </div>

            <Link
              href="/passport"
              className="gradient-accent-dark mt-5 flex w-full items-center justify-center gap-2 rounded-3xl border border-white/10 py-3.5 text-center text-base font-semibold text-white transition-transform active:scale-[0.98]"
            >
              <span className="text-xl">🍽️</span>
              Your dish passport
            </Link>
          </section>
        ) : (
          <ol className="mt-14 space-y-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex items-start gap-4 rounded-3xl border border-border bg-surface p-4 backdrop-blur-sm"
              >
                <span className="gradient-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
