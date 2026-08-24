import { notFound } from "next/navigation";
import CookingComplete from "@/components/CookingComplete";
import { getRecipeById } from "@/lib/recipes";

export default async function CookDonePage({ params }) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) notFound();

  return <CookingComplete recipe={recipe} />;
}
