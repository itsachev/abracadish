import { notFound } from "next/navigation";
import CookingMode from "@/components/CookingMode";
import { getRecipeById } from "@/lib/recipes";

export default async function CookPage({ params }) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) notFound();

  return <CookingMode recipe={recipe} />;
}
