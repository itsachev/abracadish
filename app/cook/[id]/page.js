import { notFound } from "next/navigation";
import CookingMode from "@/components/CookingMode";
import { getRecipe } from "@/lib/mockData";

export default async function CookPage({ params }) {
  const { id } = await params;
  const recipe = getRecipe(id);
  if (!recipe) notFound();

  return <CookingMode recipe={recipe} />;
}
