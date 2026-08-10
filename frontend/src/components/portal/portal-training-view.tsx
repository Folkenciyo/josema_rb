"use client";

import { useState } from "react";

import { usePortalTrainingPlan } from "@/hooks/use-portal";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { exerciseImageUrl } from "@/lib/exercise-image";
import type { PortalExercise, PortalTrainingDay } from "@/types/portal";
import { PortalDownloads } from "./portal-downloads";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "./portal-shell";

function ExerciseRow({ exercise }: { exercise: PortalExercise }) {
  const details = [
    `${exercise.sets} × ${exercise.reps}`,
    exercise.rest_seconds ? `${exercise.rest_seconds}s descanso` : null,
    exercise.tempo ? `tempo ${exercise.tempo}` : null,
  ].filter(Boolean);

  return (
    <li className="flex gap-3 px-4 py-3">
      <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {exercise.image_path && (
          // eslint-disable-next-line @next/next/no-img-element -- static mount, no loader needed
          <img
            src={exerciseImageUrl(exercise.image_path)}
            alt={exercise.name_es}
            className="size-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-slate-800">{exercise.name_es}</p>
        <p className="text-sm text-slate-500">{details.join(" · ")}</p>
        {exercise.notes && (
          <p className="mt-1 text-sm text-slate-400">{exercise.notes}</p>
        )}
      </div>
    </li>
  );
}

function DayCard({ day }: { day: PortalTrainingDay }) {
  return (
    <Card>
      <h2 className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">
        {day.day_of_week_es}
      </h2>
      {day.exercises.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-500">Descanso</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {day.exercises.map((exercise, index) => (
            <ExerciseRow key={`${exercise.name_es}-${index}`} exercise={exercise} />
          ))}
        </ul>
      )}
    </Card>
  );
}

export function PortalTrainingView({ token }: { token: string }) {
  const { data: plan, isPending, error } = usePortalTrainingPlan(token);
  const [weekIndex, setWeekIndex] = useState(0);

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
                  ? "bg-amber-500 text-slate-900"
                  : "border border-slate-300 bg-white text-slate-600",
              )}
            >
              Semana {candidate.week_number}
            </button>
          ))}
        </div>
      )}

      {week?.notes && (
        <p className="text-sm text-slate-500">{week.notes}</p>
      )}

      {week?.days.map((day) => (
        <DayCard key={day.day_of_week_es} day={day} />
      ))}

      <PortalDownloads token={token} plan="training-plan" />
    </PortalPage>
  );
}
