"use client";

import { Dumbbell } from "lucide-react";

import { usePortalExercise } from "@/hooks/use-portal";
import { Badge } from "@/components/ui/badge";
import { ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { exerciseImageUrl } from "@/lib/exercise-image";
import type { PortalExerciseDetail } from "@/types/portal";

interface PortalExerciseModalProps {
  token: string;
  exerciseId: string;
  /** What the routine calls it, so the title is right before the sheet lands. */
  name: string;
  onClose: () => void;
}

function AttributeList({ exercise }: { exercise: PortalExerciseDetail }) {
  const attributes = [
    { label: "Categoría", value: exercise.category_es },
    { label: "Nivel", value: exercise.level_es },
    { label: "Equipo", value: exercise.equipment_es },
    { label: "Fuerza", value: exercise.force_es },
    { label: "Mecánica", value: exercise.mechanic_es },
  ].filter((attribute) => attribute.value);

  if (attributes.length === 0) {
    return null;
  }

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {attributes.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className="font-medium text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MuscleGroup({
  title,
  muscles,
  className,
}: {
  title: string;
  muscles: string[];
  className?: string;
}) {
  if (muscles.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-500 uppercase">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {muscles.map((muscle) => (
          <Badge key={muscle} className={className}>
            {muscle}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/**
 * How an exercise is done, opened from a row of the routine or of the guided
 * session. Read-only by nature: the client is looking something up mid-set, on
 * a phone, and everything the trainer can do with a sheet is out of place here.
 */
export function PortalExerciseModal({
  token,
  exerciseId,
  name,
  onClose,
}: PortalExerciseModalProps) {
  const {
    data: exercise,
    isPending,
    error,
  } = usePortalExercise(token, exerciseId);

  return (
    <Modal title={exercise?.name_es ?? name} onClose={onClose}>
      {isPending ? (
        <LoadingState />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <div className="flex flex-col gap-4">
          {exercise.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {exercise.images.map((path) => (
                // eslint-disable-next-line @next/next/no-img-element -- static mount, no loader needed
                <img
                  key={path}
                  src={exerciseImageUrl(path)}
                  alt={exercise.name_es}
                  className="h-36 w-full rounded-lg border border-slate-200 object-cover"
                />
              ))}
            </div>
          ) : (
            // Part of the catalogue has no photo; an empty box reads as broken.
            <div className="flex h-24 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-300">
              <Dumbbell className="size-8" />
            </div>
          )}

          <AttributeList exercise={exercise} />

          <MuscleGroup
            title="Músculos principales"
            muscles={exercise.primary_muscles_es}
            className="bg-brand-100 text-brand-700"
          />
          <MuscleGroup
            title="Músculos secundarios"
            muscles={exercise.secondary_muscles_es}
          />

          {exercise.instructions_es.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-500 uppercase">
                Cómo se hace
              </p>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
                {exercise.instructions_es.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Este ejercicio todavía no tiene explicación escrita. Pregunta a tu
              entrenador si tienes dudas de cómo hacerlo.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
