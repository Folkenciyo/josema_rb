"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useCreateExercise } from "@/hooks/use-exercises";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ExerciseForm } from "./exercise-form";

export function NewExerciseView() {
  const router = useRouter();
  const createExercise = useCreateExercise();

  return (
    <>
      <Link
        href="/exercises"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        Ejercicios
      </Link>

      <PageHeader
        title="Nuevo ejercicio"
        description="Se añade a la librería y podrás usarlo en cualquier plan."
      />

      <Card className="max-w-3xl p-6">
        <ExerciseForm
          submitLabel="Crear ejercicio"
          isSubmitting={createExercise.isPending}
          error={createExercise.error}
          onCancel={() => router.push("/exercises")}
          onSubmit={(input) =>
            createExercise.mutate(input, {
              onSuccess: () => router.push("/exercises"),
            })
          }
        />
      </Card>
    </>
  );
}
