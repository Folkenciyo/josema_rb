import type { Metadata } from "next";

import { NewExerciseView } from "@/components/exercises/new-exercise-view";

export const metadata: Metadata = { title: "Nuevo ejercicio · JOSEMA RB" };

export default function NewExercisePage() {
  return <NewExerciseView />;
}
