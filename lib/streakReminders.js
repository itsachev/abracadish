import webpush from "web-push";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@abracadish.app";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function utcDayStart(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Users whose streak is at risk of resetting: they scanned yesterday (UTC
// calendar day) but haven't scanned yet today, and have a push subscription.
// UTC is a simplification — without per-user timezones, "today"/"yesterday"
// are approximate for users far from UTC, but it keeps the reminder roughly
// timely without a schema change to store timezone.
async function findAtRiskUserIds() {
  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const todayStart = utcDayStart(now);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const { data: scans, error } = await supabase
    .from("scans")
    .select("user_id, created_at")
    .gte("created_at", yesterdayStart.toISOString());
  if (error) throw new Error(error.message);

  const scannedToday = new Set();
  const scannedYesterday = new Set();
  for (const scan of scans ?? []) {
    const scannedAt = new Date(scan.created_at);
    if (scannedAt >= todayStart) scannedToday.add(scan.user_id);
    else scannedYesterday.add(scan.user_id);
  }

  return [...scannedYesterday].filter((userId) => !scannedToday.has(userId));
}

// Sends the streak-reminder push to every at-risk, subscribed user. Returns
// a summary rather than throwing on individual failures — one dead
// subscription shouldn't abort the whole run.
export async function sendStreakReminders() {
  configureWebPush();
  const supabase = getSupabaseAdminClient();

  const atRiskUserIds = await findAtRiskUserIds();
  if (atRiskUserIds.length === 0) {
    return { sent: 0, failed: 0, staleRemoved: 0, atRisk: 0 };
  }

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", atRiskUserIds);
  if (error) throw new Error(error.message);

  const payload = JSON.stringify({
    title: "Keep your streak alive 🔥",
    body: "You haven't scanned a dish today — scan one now to keep your streak going.",
    url: "/scan",
  });

  let sent = 0;
  let failed = 0;
  let staleRemoved = 0;

  await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        // 404/410 means the browser has dropped this subscription — clean it up.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          staleRemoved += 1;
        }
      }
    })
  );

  return { sent, failed, staleRemoved, atRisk: atRiskUserIds.length };
}
