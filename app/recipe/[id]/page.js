import Link from "next/link";
import { notFound } from "next/navigation";
import MatchBadge from "@/components/MatchBadge";
import SaveButton from "@/components/SaveButton";
import RecipeRemixBar from "@/components/RecipeRemixBar";
import { getRecipeById } from "@/lib/recipes";

export default async function RecipePage({ params, searchParams }) {
  const { id } = await params;
  const { score, reasons } = await searchParams;
  const recipe = await getRecipeById(id);
  if (!recipe) notFound();

  const matchScore = score ? Number(score) : null;
  const matchReasons = reasons ? reasons.split("|") : [];

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">{recipe.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {recipe.cuisine} · {recipe.protein} · Serves {recipe.servings}
          </p>
        </div>
        {matchScore !== null && (
          <div className="shrink-0 text-right">
            <div className="gradient-text font-mono text-xl font-bold">
              {Math.round(matchScore * 100)}%
            </div>
            <div className="text-xs text-muted">match</div>
          </div>
        )}
      </div>

      <div className="mt-4 mb-10 flex items-center gap-2">
        <MatchBadge matchType={recipe.matchType} />
        {recipe.source?.remixOf && (
          <span className="rounded-full bg-white/8 py-2 px-4 text-xs text-muted">
            Remixed: {recipe.source.remixLabel}
            {recipe.source.remixOfTitle ? (
              <>
                {" · from "}
                <Link href={`/recipe/${recipe.source.remixOf}`} className="text-accent underline">
                  {recipe.source.remixOfTitle}
                </Link>
              </>
            ) : null}
          </span>
        )}
      </div>

      {matchReasons.length > 0 && (
        <section className="mt-5 rounded-2xl border border-border bg-surface p-4 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-foreground">Why this matches</h2>
          <ul className="mt-2 space-y-1">
            {matchReasons.map((reason) => (
              <li key={reason} className="flex items-center gap-2 text-sm text-foreground/90">
                <span className="text-emerald-400">✓</span>
                {reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Ingredients
        </h2>
        <ul className="mt-2 divide-y divide-border">
          {recipe.ingredients.map((ingredient) => (
            <li
              key={ingredient.name}
              className="flex items-center justify-between py-2 text-sm text-foreground/90"
            >
              <span>{ingredient.name}</span>
              <span className="font-mono text-muted">
                {ingredient.quantity} {ingredient.unit}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <RecipeRemixBar recipe={recipe} />

      <section className="mt-6 text-xs text-muted">
        <p>
          Source: {recipe.source.name}
          {recipe.source.url ? (
            <>
              {" · "}
              <a href={recipe.source.url} className="text-accent underline">
                view original
              </a>
            </>
          ) : null}
        </p>
      </section>

      <div className="mt-8 flex gap-3">
        <Link
          href={`/cook/${recipe.id}`}
          className="gradient-accent glow-accent flex-1 rounded-2xl py-3.5 text-center text-base font-semibold text-white transition-transform active:scale-[0.98]"
        >
          Start Cooking
        </Link>
        <SaveButton recipeId={recipe.id} className="flex-none" />
      </div>

      <Link
        href="/scan"
        className="mt-4 block text-center text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        Scan another dish
      </Link>
    </div>
  );
}
