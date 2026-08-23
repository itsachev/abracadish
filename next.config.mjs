/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets the dev server's JS chunks/HMR socket load when the app is
  // reached over the LAN IP (phone/desktop testing) instead of localhost —
  // without this, Next.js silently blocks those requests as cross-origin,
  // so the page renders but never hydrates (dead buttons, no client state).
  allowedDevOrigins: ["192.168.0.6"],
};

export default nextConfig;
