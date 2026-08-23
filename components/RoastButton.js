"use client";

import { useState } from "react";

export default function RoastButton({ photo, dishName }) {
  const [roast, setRoast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleRoast() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo, dishName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Couldn't roast this one.");
      }
      const data = await res.json();
      setRoast(data.roast);
    } catch (err) {
      setError(err.message || "Couldn't roast this one.");
    } finally {
      setLoading(false);
    }
  }

  if (roast) {
    return (
      <div className="mt-4 rounded-2xl border border-accent/30 bg-accent-soft p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">🔥 The roast</p>
        <p className="mt-1.5 text-sm italic text-foreground/90">&ldquo;{roast}&rdquo;</p>
        <button
          type="button"
          onClick={handleRoast}
          disabled={loading}
          className="mt-2 text-xs font-medium text-muted underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
        >
          {loading ? "Roasting…" : "Roast again"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleRoast}
        disabled={loading}
        className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-foreground disabled:opacity-50"
      >
        {loading ? "Roasting…" : "🔥 Roast my plating"}
      </button>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
