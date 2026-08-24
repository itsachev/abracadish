// Best-effort emoji for a cuisine name, for the Dish Passport's stamp visuals.
// Purely decorative — an unmapped cuisine just falls back to a plate emoji,
// never breaks anything.
const CUISINE_EMOJI = {
  italian: "🇮🇹",
  french: "🇫🇷",
  thai: "🇹🇭",
  mexican: "🇲🇽",
  "tex-mex": "🌮",
  japanese: "🇯🇵",
  russian: "🇷🇺",
  "middle eastern": "🧆",
  greek: "🇬🇷",
  bulgarian: "🇧🇬",
  american: "🇺🇸",
  british: "🇬🇧",
  spanish: "🇪🇸",
  vietnamese: "🇻🇳",
  hungarian: "🇭🇺",
  austrian: "🇦🇹",
  indian: "🇮🇳",
  chinese: "🇨🇳",
  korean: "🇰🇷",
  german: "🇩🇪",
  turkish: "🇹🇷",
  lebanese: "🇱🇧",
  moroccan: "🇲🇦",
  ethiopian: "🇪🇹",
  portuguese: "🇵🇹",
  polish: "🇵🇱",
  indonesian: "🇮🇩",
  filipino: "🇵🇭",
  brazilian: "🇧🇷",
  peruvian: "🇵🇪",
  caribbean: "🏝️",
  mediterranean: "🫒",
  scandinavian: "🇸🇪",
};

export function getCuisineEmoji(cuisine) {
  if (!cuisine) return "🍽️";
  return CUISINE_EMOJI[cuisine.trim().toLowerCase()] ?? "🍽️";
}
