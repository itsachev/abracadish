import Link from "next/link";
import MatchBadge from "@/components/MatchBadge";

export default function RecipeCard({ recipe }) {
  const pct = Math.round(recipe.matchScore * 100);
  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="group block rounded-2xl border border-border bg-surface p-4 backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{recipe.title}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {recipe.cuisine} · {recipe.protein}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="gradient-text font-mono text-lg font-bold">{pct}%</div>
          <div className="text-xs text-muted">match</div>
        </div>
      </div>
      <div className="mt-3">
        <MatchBadge matchType={recipe.matchType} />
      </div>
    </Link>
  );
}
