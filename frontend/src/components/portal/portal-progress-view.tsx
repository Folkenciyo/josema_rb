"use client";

import { useState } from "react";

import {
  ProgressionChart,
  ProgressionDelta,
} from "@/components/clients/exercise-progression-card";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  usePortalExerciseHistory,
  usePortalTrainedExercises,
} from "@/hooks/use-portal";
import { formatDate } from "@/lib/format";
import type { TrainedExercise } from "@/types/workout";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "./portal-shell";

function Progression({
  token,
  exerciseId,
}: {
  token: string;
  exerciseId: string;
}) {
  const {
    data: history,
    isPending,
    error,
  } = usePortalExerciseHistory(token, exerciseId);

  if (isPending) {
    return (
      <div className="px-5 py-4">
        <Spinner className="size-4" />
      </div>
    );
  }

  if (error || !history) {
    return (
      <p className="px-5 py-4 text-sm text-slate-500">
        No se ha podido cargar esta gráfica. Inténtalo dentro de un rato.
      </p>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="text-sm text-slate-500">Tu serie más pesada de cada día</p>
        <ProgressionDelta history={history.points} />
      </div>
      <ProgressionChart history={history.points} />
    </>
  );
}

function BestSoFar({ exercise }: { exercise: TrainedExercise }) {
  return (
    <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
      {exercise.best_weight_kg !== null && (
        <>
          Tu récord:{" "}
          <span className="font-semibold text-slate-800">
            {exercise.best_weight_kg} kg
          </span>
          {" · "}
        </>
      )}
      {exercise.session_count}{" "}
      {exercise.session_count === 1 ? "sesión" : "sesiones"} · la última el{" "}
      {formatDate(exercise.last_performed_on)}
    </p>
  );
}

/** What the client has been lifting, exercise by exercise. */
export function PortalProgressView({ token }: { token: string }) {
  const {
    data: exercises,
    isPending,
    error,
  } = usePortalTrainedExercises(token);
  const [selected, setSelected] = useState<string | null>(null);

  if (isPending) {
    return (
      <PortalPage>
        <PortalLoading />
      </PortalPage>
    );
  }

  if (error || !exercises) {
    return (
      <PortalPage>
        <PortalHeader title="Mi progreso" />
        <PortalNotice
          title="Este enlace ya no sirve"
          description="Pídele a tu entrenador el enlace nuevo y vuelve a entrar."
        />
      </PortalPage>
    );
  }

  if (exercises.length === 0) {
    return (
      <PortalPage>
        <PortalHeader title="Mi progreso" />
        <PortalNotice
          title="Todavía no hay nada que dibujar"
          description="Apunta los pesos de tus sesiones desde Entreno y aquí verás cómo van subiendo."
        />
      </PortalPage>
    );
  }

  const current = selected ?? exercises[0].exercise_id;
  const exercise =
    exercises.find((item) => item.exercise_id === current) ?? exercises[0];

  return (
    <PortalPage>
      <PortalHeader
        title="Mi progreso"
        subtitle="De lo que apuntas al entrenar."
      />

      <Card>
        <label className="block px-5 pt-4">
          <span className="sr-only">Ejercicio</span>
          <Select
            value={current}
            onChange={(event) => setSelected(event.target.value)}
          >
            {exercises.map((item) => (
              <option key={item.exercise_id} value={item.exercise_id}>
                {item.exercise_name}
              </option>
            ))}
          </Select>
        </label>

        <Progression token={token} exerciseId={current} />
        <BestSoFar exercise={exercise} />
      </Card>
    </PortalPage>
  );
}
