// Server-only: resolves lat/lng to a human-readable place name via OpenStreetMap's
// Nominatim (free, no API key). Usage policy requires a descriptive User-Agent and
// reasonable request volume: https://operations.osmfoundation.org/policies/nominatim/.
// Revisit with a paid geocoding provider (e.g. Google Maps Platform) if volume grows
// beyond what's reasonable for a free shared service.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

export async function reverseGeocode(lat, lng) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "10"); // city-level detail, not a street address
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");

  const response = await fetch(url, {
    headers: { "User-Agent": "Abracadish/0.1 (food recognition app; dev/testing)" },
  });

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed (${response.status})`);
  }

  const payload = await response.json();
  const address = payload.address ?? {};
  const locality = address.city ?? address.town ?? address.village ?? address.county ?? address.state;
  const country = address.country;

  return [locality, country].filter(Boolean).join(", ") || payload.display_name || null;
}
