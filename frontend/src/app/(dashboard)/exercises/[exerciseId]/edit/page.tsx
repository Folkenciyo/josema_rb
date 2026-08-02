import type { Metadata } from "next";

import { EditExerciseView } from "@/components/exercises/edit-exercise-view";

export const metadata: Metadata = { title: "Editar ejercicio · JOSEMA RB" };

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;

  return <EditExerciseView exerciseId={exerciseId} />;
}
