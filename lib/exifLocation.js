// Client-only: reads GPS EXIF data from an uploaded photo before it gets
// redrawn onto a canvas (which strips all metadata, including EXIF).

export async function extractGpsFromFile(file) {
  try {
    const mod = await import("exifr");
    const gps = mod.gps ?? mod.default?.gps;
    if (typeof gps !== "function") return null;

    const result = await gps(file);
    if (!result || typeof result.latitude !== "number" || typeof result.longitude !== "number") {
      return null;
    }
    return { lat: result.latitude, lng: result.longitude, source: "exif" };
  } catch {
    return null;
  }
}
