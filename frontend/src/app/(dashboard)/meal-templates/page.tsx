import type { Metadata } from "next";

import { MealTemplatesView } from "@/components/diet/meal-templates-view";

export const metadata: Metadata = { title: "Comidas · JOSEMA RB" };

export default function MealTemplatesPage() {
  return <MealTemplatesView />;
}
