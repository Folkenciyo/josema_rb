"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorMessage } from "@/components/ui/feedback";
import { Spinner } from "@/components/ui/spinner";
import { useExerciseHistory, useTrainedExercises } from "@/hooks/use-workouts";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import {
  buildProgressionGeometry,
  progressionDelta,
} from "@/lib/workout/progression-chart";
import type { ExercisePoint } from "@/types/workout";

const VIEWBOX_WIDTH = 300;
const VIEWBOX_HEIGHT = 80;

function Delta({ history }: { history: ExercisePoint[] }) {
  const delta = progressionDelta(history);

  if (delta === null || delta === 0) {
    return null;
  }

  const Icon = delta > 0 ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-semibold",
        delta > 0 ? "text-emerald-600" : "text-red-500",
      )}
    >
      <Icon className="size-4" />
      {delta > 0 ? "+" : ""}
      {delta} kg
    </span>
  );
}

function ProgressionChart({ history }: { history: ExercisePoint[] }) {
  const geometry = buildProgressionGeometry(
    history,
    VIEWBOX_WIDTH,
    VIEWBOX_HEIGHT,
  );

  if (!geometry) {
    return (
      <p className="px-5 py-4 text-sm text-slate-500">
        Con una sola sesión todavía no hay línea que dibujar. A la siguiente ya
        se ve si sube.
      </p>
    );
  }

  const { points, path, minWeight, maxWeight } = geometry;

  return (
    <figure className="px-5 py-4">
      {/* Hand-rolled SVG, like the weight chart: no library for one line. */}
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Evolución de la carga, de ${minWeight} a ${maxWeight} kg`}
        className="h-20 w-full"
      >
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="text-brand-600"
        />
        {points.map((item) => (
          <circle
            key={item.point.performed_on}
            cx={item.x}
            cy={item.y}
            r={2.5}
            className="fill-brand-600"
            vectorEffect="non-scaling-stroke"
          >
            <title>
              {`${formatDate(item.point.performed_on)}: ${item.point.top_weight_kg} kg × ${item.point.top_reps ?? "?"}`}
            </title>
          </circle>
        ))}
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{formatDate(points[0].point.performed_on)}</span>
        <span>
          {minWeight} – {maxWeight} kg
        </span>
        <span>{formatDate(points[points.length - 1].point.performed_on)}</span>
      </figcaption>
    </figure>
  );
}

function Progression({
  clientId,
  exerciseId,
}: {
  clientId: string;
  exerciseId: string;
}) {
  const {
    data: history,
    isPending,
    error,
  } = useExerciseHistory(clientId, exerciseId);

  if (isPending) {
    return (
      <div className="px-5 py-4">
        <Spinner className="size-4" />
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="px-5 py-4">
        <ErrorMessage error={error ?? new Error("No se ha podido cargar")} />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="text-sm text-slate-500">
          Serie más pesada de cada sesión
        </p>
        <Delta history={history.points} />
      </div>
      <ProgressionChart history={history.points} />
    </>
  );
}

/** Whether the client is actually getting stronger, exercise by exercise. */
export function ExerciseProgressionCard({ clientId }: { clientId: string }) {
  const { data: exercises, isPending, error } = useTrainedExercises(clientId);
  const [selected, setSelected] = useState<string | null>(null);

  const current = selected ?? exercises?.[0]?.exercise_id ?? null;

  return (
    <Card>
      <CardHeader title="Progresión por ejercicio" />
      {error && <ErrorMessage error={error} />}

      {isPending ? (
        <div className="px-5 py-4">
          <Spinner className="size-4" />
        </div>
      ) : exercises && exercises.length > 0 && current ? (
        <>
          <label className="block px-5 pt-4">
            <span className="sr-only">Ejercicio</span>
            <select
              value={current}
              onChange={(event) => setSelected(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm font-medium text-slate-800"
            >
              {exercises.map((exercise) => (
                <option key={exercise.exercise_id} value={exercise.exercise_id}>
                  {exercise.exercise_name} · {exercise.session_count}{" "}
                  {exercise.session_count === 1 ? "sesión" : "sesiones"}
                </option>
              ))}
            </select>
          </label>
          <Progression clientId={clientId} exerciseId={current} />
        </>
      ) : (
        <EmptyState
          title="Todavía no hay cargas que comparar"
          description="En cuanto el cliente registre sus sesiones, aquí verás si va subiendo."
        />
      )}
    </Card>
  );
}
