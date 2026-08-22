import { MATCH_TYPE_LABELS } from "@/lib/mockData";

const STYLES = {
  official: "bg-emerald-400/10 text-emerald-400",
  likely: "bg-accent-soft text-accent",
  similar: "bg-amber-400/10 text-amber-400",
  "ai-generated": "bg-white/8 text-muted",
};

export default function MatchBadge({ matchType }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
        STYLES[matchType] ?? STYLES["ai-generated"]
      }`}
    >
      {MATCH_TYPE_LABELS[matchType] ?? "Similar recipe"}
    </span>
  );
}
