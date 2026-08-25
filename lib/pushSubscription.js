"use client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Web Push requires the VAPID public key as a Uint8Array, but it's handed
// out as a URL-safe base64 string.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}

export async function getPushSubscriptionState() {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  return existing ? "subscribed" : "not-subscribed";
}

// Requests notification permission (if not already granted/denied), then
// subscribes via the browser's push service and hands the subscription to
// the caller to persist server-side.
export async function subscribeToPush() {
  if (!isPushSupported()) throw new Error("Push notifications aren't supported here.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");

  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  return subscription.toJSON();
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return null;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return endpoint;
}
