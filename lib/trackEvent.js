"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";
import { getAnalyticsSessionId } from "@/lib/analyticsSession";

// Fire-and-forget funnel analytics (see supabase/schema_events.sql) tracking
// the Photo -> Recipe -> Cooking session funnel from app_idea.md's north-star
// metric. Never throws or blocks the caller — a failed insert should cost one
// missing data point, not a broken user flow.
export function trackEvent(eventType, { dishName, recipeId, ...metadata } = {}) {
  const sessionId = getAnalyticsSessionId();
  if (!sessionId) return;

  try {
    const supabase = getSupabaseClient();
    supabase.auth
      .getSession()
      .then(({ data }) =>
        supabase.from("funnel_events").insert({
          session_id: sessionId,
          user_id: data.session?.user?.id ?? null,
          event_type: eventType,
          dish_name: dishName ?? null,
          recipe_id: recipeId ?? null,
          metadata,
        })
      )
      .then(({ error }) => {
        if (error) console.error("trackEvent failed:", error.message);
      });
  } catch (err) {
    console.error("trackEvent failed:", err);
  }
}
