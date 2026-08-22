"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/useAuthUser";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { uploadScanPhoto } from "@/lib/scans";
import { readScanLocation } from "@/lib/scanLocation";

function subscribeNoop() {
  return () => {};
}

function getServerSnapshotNull() {
  return null;
}

export default function SaveScanButton({ dish, answers, restaurantName, photo }) {
  const user = useAuthUser();
  const location = useSyncExternalStore(subscribeNoop, readScanLocation, getServerSnapshotNull);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error

  async function handleSave() {
    setStatus("saving");

    const imagePath = photo ? await uploadScanPhoto(user.id, photo) : null;

    const { error } = await getSupabaseClient()
      .from("scans")
      .insert({
        user_id: user.id,
        dish_name: dish.name,
        confidence: dish.confidence,
        cuisine: dish.cuisine,
        region: dish.region,
        confirmed_ingredients: dish.confirmedIngredients,
        possible_ingredients: dish.possibleIngredients,
        answers,
        restaurant_name: restaurantName || null,
        location: location ? { lat: location.lat, lng: location.lng, source: location.source } : null,
        location_label: location?.label ?? null,
        image_path: imagePath,
      });

    setStatus(error ? "error" : "saved");
  }

  if (user === undefined) {
    return <div className="mt-4 h-14" />;
  }

  if (!user) {
    return (
      <div className="mt-4 rounded-2xl border border-border bg-surface p-4 text-center text-sm text-muted">
        <Link href="/login" className="text-accent underline">
          Sign in
        </Link>{" "}
        to save this scan to your history.
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={status === "saving" || status === "saved"}
      className={`mt-4 w-full rounded-2xl py-3.5 text-base font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-70 ${
        status === "saved" ? "bg-emerald-500" : "gradient-accent glow-accent"
      }`}
    >
      {status === "saving"
        ? "Saving…"
        : status === "saved"
          ? "Scan saved ✓"
          : status === "error"
            ? "Couldn't save — try again"
            : "Save this scan"}
    </button>
  );
}
