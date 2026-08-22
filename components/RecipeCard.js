import Link from "next/link";
import MatchBadge from "@/components/MatchBadge";

// matchScore/matchReasons are ephemeral, query-time results (from
// /api/match-recipes) — not stored on the recipe row — so we carry them
// through the URL to the detail page rather than re-querying there.
export default function RecipeCard({ recipe }) {
  const hasScore = typeof recipe.matchScore === "number";
  const params = new URLSearchParams();
  if (hasScore) params.set("score", recipe.matchScore.toFixed(3));
  if (recipe.matchReasons?.length) params.set("reasons", recipe.matchReasons.join("|"));
  const query = params.toString();

  return (
    <Link
      href={`/recipe/${recipe.id}${query ? `?${query}` : ""}`}
      className="group block rounded-2xl border border-border bg-surface p-4 backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{recipe.title}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {recipe.cuisine} · {recipe.protein}
          </p>
        </div>
        {hasScore && (
          <div className="shrink-0 text-right">
            <div className="gradient-text font-mono text-lg font-bold">
              {Math.round(recipe.matchScore * 100)}%
            </div>
            <div className="text-xs text-muted">match</div>
          </div>
        )}
      </div>
      <div className="mt-3">
        <MatchBadge matchType={recipe.matchType} />
      </div>
    </Link>
  );
}
