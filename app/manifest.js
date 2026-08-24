export default function manifest() {
  return {
    name: "Abracadish",
    short_name: "Abracadish",
    description: "Snap a dish. Discover the recipe behind it. Cook it at home.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5efe3",
    theme_color: "#f5efe3",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
