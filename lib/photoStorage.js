// In-memory only. The photo just needs to survive one client-side
// navigation from /scan to /results within the same app session — Next.js
// client-side routing never reloads the page for that — so there's no
// need for persistent browser storage here at all. That sidesteps every
// storage-quota failure mode: sessionStorage's ~5-10MB cap was too tight
// on some real devices, and IndexedDB writes also failed unpredictably
// on at least one (likely memory pressure from decoding a full-resolution
// native camera photo, not an actual size problem post-downscale).
let currentPhoto = null;

export function storePhoto(dataUrl) {
  currentPhoto = dataUrl;
}

export function getPhoto() {
  return currentPhoto;
}

export function clearPhoto() {
  currentPhoto = null;
}
