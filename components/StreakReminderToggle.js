"use client";

import { useEffect, useState } from "react";
import {
  getPushSubscriptionState,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushSubscription";

export default function StreakReminderToggle() {
  const [state, setState] = useState("checking"); // checking | unsupported | denied | not-subscribed | subscribed
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isPushSupported()) {
      setState("unsupported");
      return;
    }
    getPushSubscriptionState().then(setState);
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      const subscription = await subscribeToPush();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });
      if (!res.ok) throw new Error("Couldn't save your subscription.");
      setState("subscribed");
    } catch (err) {
      setError(err.message || "Couldn't enable reminders.");
      setState(await getPushSubscriptionState());
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError(null);
    try {
      const endpoint = await unsubscribeFromPush();
      if (endpoint) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }
      setState("not-subscribed");
    } catch (err) {
      setError(err.message || "Couldn't disable reminders.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking" || state === "unsupported") return null;

  if (state === "denied") {
    return (
      <p className="mt-4 text-xs text-muted">
        Streak reminders are blocked in your browser's notification settings.
      </p>
    );
  }

  return (
    <div className="mt-4 flex items-center justify-between rounded-3xl border border-border bg-surface p-4">
      <div className="min-w-0 pr-3">
        <p className="text-sm font-medium text-foreground">Streak reminders</p>
        <p className="text-xs text-muted">
          {state === "subscribed"
            ? "We'll nudge you before your streak resets."
            : "Get a nudge if your streak is about to reset."}
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <button
        type="button"
        onClick={state === "subscribed" ? handleDisable : handleEnable}
        disabled={busy}
        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
          state === "subscribed"
            ? "border border-border text-muted hover:border-red-400/40 hover:text-red-600"
            : "gradient-accent text-white"
        }`}
      >
        {busy ? "…" : state === "subscribed" ? "Turn off" : "Turn on"}
      </button>
    </div>
  );
}
