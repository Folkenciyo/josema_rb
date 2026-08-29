"use client";

import { Fragment, useState } from "react";
import { Dumbbell, Info } from "lucide-react";

import { usePortalTrainingPlan } from "@/hooks/use-portal";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { exerciseImageUrl } from "@/lib/exercise-image";
import type { PortalExercise, PortalTrainingDay } from "@/types/portal";
import { PortalDownloads } from "./portal-downloads";
import { PortalExerciseModal } from "./portal-exercise-modal";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "./portal-shell";

function ExerciseRow({
  exercise,
  onOpen,
}: {
  exercise: PortalExercise;
  onOpen: () => void;
}) {
  const details = [
    `${exercise.sets} × ${exercise.reps}`,
    exercise.rest_seconds ? `${exercise.rest_seconds}s descanso` : null,
    exercise.tempo ? `tempo ${exercise.tempo}` : null,
  ].filter(Boolean);

  return (
    <li>
      {/* The whole row opens the sheet: mid-workout, a small target is no target. */}
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {exercise.image_path ? (
            // eslint-disable-next-line @next/next/no-img-element -- static mount, no loader needed
            <img
              src={exerciseImageUrl(exercise.image_path)}
              alt={exercise.name_es}
              className="size-full object-cover"
            />
          ) : (
            // Part of the catalogue has no photo; an empty box reads as broken.
            <span className="flex size-full items-center justify-center text-slate-300">
              <Dumbbell className="size-6" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-medium text-slate-800">
            {exercise.superset_label && (
              <span className="bg-brand-50 text-brand-700 rounded px-1.5 py-0.5 text-xs font-bold">
                {exercise.superset_label}
              </span>
            )}
            <span className="min-w-0">{exercise.name_es}</span>
            <Info className="text-brand-600 size-4 shrink-0" />
          </p>
          <p className="text-sm text-slate-500">{details.join(" · ")}</p>
          {exercise.notes && (
            <p className="mt-1 text-sm text-slate-400">{exercise.notes}</p>
          )}
        </div>
      </button>
    </li>
  );
}

function DayCard({
  day,
  onOpenExercise,
}: {
  day: PortalTrainingDay;
  onOpenExercise: (exercise: PortalExercise) => void;
}) {
  return (
    <Card>
      <h2 className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">
        {day.day_of_week_es}
      </h2>
      {/* What the trainer asks of the day, before its first exercise. */}
      {day.notes && (
        <p className="border-brand-600 border-l-4 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          {day.notes}
        </p>
      )}
      {day.exercises.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-500">Descanso</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {day.exercises.map((exercise, index) => (
            <Fragment key={`${exercise.name_es}-${index}`}>
              {/* The note of a block sits above the pair it describes. */}
              {exercise.superset_note && (
                <li className="border-brand-600 border-l-4 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                  {exercise.superset_note}
                </li>
              )}
              <ExerciseRow
                exercise={exercise}
                onOpen={() => onOpenExercise(exercise)}
              />
            </Fragment>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function PortalTrainingView({ token }: { token: string }) {
  const { data: plan, isPending, error } = usePortalTrainingPlan(token);
  const [weekIndex, setWeekIndex] = useState(0);
  const [openExercise, setOpenExercise] = useState<PortalExercise | null>(null);

  if (isPending) {
    return (
      <PortalPage>
        <PortalLoading />
      </PortalPage>
    );
  }

  if (error) {
    return (
      <PortalPage>
        <PortalHeader title="Mi rutina" />
        <PortalNotice
          title="Todavía no hay rutina"
          description="En cuanto tu entrenador publique tu plan lo verás aquí."
        />
      </PortalPage>
    );
  }

  const week = plan.weeks[weekIndex] ?? plan.weeks[0];

  return (
    <PortalPage>
      <PortalHeader title="Mi rutina" subtitle={plan.plan_title} />

      {plan.plan_notes && (
        <Card className="px-4 py-3 text-sm text-slate-600">
          {plan.plan_notes}
        </Card>
      )}

      {plan.weeks.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {plan.weeks.map((candidate, index) => (
            <button
              key={candidate.week_number}
              onClick={() => setWeekIndex(index)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold",
                index === weekIndex
                  ? "bg-brand-600 text-white"
                  : "bg-surface border border-slate-300 text-slate-600",
              )}
            >
              Semana {candidate.week_number}
            </button>
          ))}
        </div>
      )}

      {week?.notes && <p className="text-sm text-slate-500">{week.notes}</p>}

      {week?.days.map((day) => (
        <DayCard
          key={day.day_of_week_es}
          day={day}
          onOpenExercise={setOpenExercise}
        />
      ))}

      <PortalDownloads token={token} plan="training-plan" />

      {openExercise && (
        <PortalExerciseModal
          token={token}
          exerciseId={openExercise.exercise_id}
          name={openExercise.name_es}
          onClose={() => setOpenExercise(null)}
        />
      )}
    </PortalPage>
  );
}
