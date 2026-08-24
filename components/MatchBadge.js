import { MATCH_TYPE_LABELS } from "@/lib/recipeMatch";

const STYLES = {
  official: "bg-emerald-400/10 text-emerald-600",
  likely: "bg-accent-soft text-accent",
  similar: "bg-amber-400/10 text-amber-600",
  "ai-generated": "bg-black/5 text-muted",
};

export default function MatchBadge({ matchType }) {
  return (
    <span
      className={`inline-block rounded-full py-2 px-4 text-xs font-medium ${
        STYLES[matchType] ?? STYLES["ai-generated"]
      }`}
    >
      {MATCH_TYPE_LABELS[matchType] ?? "Similar recipe"}
    </span>
  );
}
