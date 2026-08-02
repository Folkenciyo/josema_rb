"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useExercise, useUpdateExercise } from "@/hooks/use-exercises";
import { Card } from "@/components/ui/card";
import { ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { isCustomExercise } from "@/types/exercise";
import { ExerciseForm } from "./exercise-form";

export function EditExerciseView({ exerciseId }: { exerciseId: string }) {
  const router = useRouter();
  const { data: exercise, isPending, error } = useExercise(exerciseId);
  const updateExercise = useUpdateExercise(exerciseId);

  if (isPending) {
    return <LoadingState />;
  }

  if (error || !exercise) {
    return <ErrorMessage error={error ?? new Error("Ejercicio no encontrado.")} />;
  }

  if (!isCustomExercise(exercise)) {
    return (
      <ErrorMessage
        error={
          new Error(
            "Este ejercicio viene de la librería importada y no se puede editar.",
          )
        }
      />
    );
  }

  return (
    <>
      <Link
        href="/exercises"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        Ejercicios
      </Link>

      <PageHeader title={`Editar: ${exercise.name_es}`} />

      <Card className="max-w-3xl p-6">
        <ExerciseForm
          exercise={exercise}
          submitLabel="Guardar cambios"
          isSubmitting={updateExercise.isPending}
          error={updateExercise.error}
          onCancel={() => router.push("/exercises")}
          onSubmit={(input) =>
            updateExercise.mutate(input, {
              onSuccess: () => router.push("/exercises"),
            })
          }
        />
      </Card>
    </>
  );
}
