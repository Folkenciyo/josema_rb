import type { Metadata } from "next";

import { ExercisesView } from "@/components/exercises/exercises-view";

export const metadata: Metadata = { title: "Ejercicios · JOSEMA RB" };

export default function ExercisesPage() {
  return <ExercisesView />;
}
