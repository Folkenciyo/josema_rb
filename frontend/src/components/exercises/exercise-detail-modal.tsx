"use client";

import Link from "next/link";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import { useDeleteExercise, useSetExerciseHidden } from "@/hooks/use-exercises";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { canDeleteExercise, type Exercise } from "@/types/exercise";
import { ExerciseImage } from "./exercise-image";

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

function AttributeList({ exercise }: { exercise: Exercise }) {
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
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
      {attributes.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className="font-medium text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ExerciseDetailModal({
  exercise,
  onClose,
}: ExerciseDetailModalProps) {
  const deleteExercise = useDeleteExercise();
  const setHidden = useSetExerciseHidden();
  const canDelete = canDeleteExercise(exercise);

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar el ejercicio "${exercise.name_es}"?`)) {
      deleteExercise.mutate(exercise.id, { onSuccess: onClose });
    }
  };

  const handleHide = () => {
    setHidden.mutate(
      { exerciseId: exercise.id, hidden: !exercise.is_hidden },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal title={exercise.name_es} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {exercise.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {exercise.images.map((path) => (
              <ExerciseImage
                key={path}
                path={path}
                alt={exercise.name_es}
                className="h-44 w-full rounded-lg"
              />
            ))}
          </div>
        )}

        <AttributeList exercise={exercise} />

        {exercise.primary_muscles_es.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-500 uppercase">
              Músculos principales
            </p>
            <div className="flex flex-wrap gap-1.5">
              {exercise.primary_muscles_es.map((muscle) => (
                <Badge key={muscle} className="bg-brand-100 text-brand-700">
                  {muscle}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {exercise.secondary_muscles_es.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-500 uppercase">
              Músculos secundarios
            </p>
            <div className="flex flex-wrap gap-1.5">
              {exercise.secondary_muscles_es.map((muscle) => (
                <Badge key={muscle}>{muscle}</Badge>
              ))}
            </div>
          </div>
        )}

        {exercise.instructions_es.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-500 uppercase">
              Instrucciones
            </p>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
              {exercise.instructions_es.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        <ErrorMessage error={deleteExercise.error ?? setHidden.error} />

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          {canDelete ? (
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteExercise.isPending}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handleHide}
              loading={setHidden.isPending}
              title={
                exercise.is_hidden
                  ? "Vuelve al buscador y al selector de rutinas"
                  : "Lo saca del buscador; las rutinas que ya lo usan no cambian"
              }
            >
              {exercise.is_hidden ? (
                <>
                  <Eye className="size-4" />
                  Mostrar
                </>
              ) : (
                <>
                  <EyeOff className="size-4" />
                  Ocultar
                </>
              )}
            </Button>
          )}

          <Link href={`/exercises/${exercise.id}/edit`}>
            <Button variant="secondary">
              <Pencil className="size-4" />
              Editar
            </Button>
          </Link>
        </div>

        {exercise.created_by_trainer_id === null && (
          <p className="text-xs text-slate-500">
            Viene de la librería importada. Si lo editas pasa a ser tuyo y deja
            de actualizarse con el catálogo.
          </p>
        )}
      </div>
    </Modal>
  );
}
