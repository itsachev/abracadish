import { NextResponse } from "next/server";
import { sendStreakReminders } from "@/lib/streakReminders";

// Triggered by Vercel Cron (see vercel.json). Guarded by a shared secret
// rather than auth, since there's no user session in a cron invocation —
// Vercel Cron sends this as a bearer token automatically when CRON_SECRET
// is set: https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  try {
    const result = await sendStreakReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Streak reminder send failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
