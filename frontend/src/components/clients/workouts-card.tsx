"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorMessage } from "@/components/ui/feedback";
import { Spinner } from "@/components/ui/spinner";
import { useClientWorkout, useClientWorkouts } from "@/hooks/use-workouts";
import { formatDate } from "@/lib/format";
import type { WorkoutSessionSummary } from "@/types/workout";

function SessionDetail({
  clientId,
  sessionId,
}: {
  clientId: string;
  sessionId: string;
}) {
  const {
    data: session,
    isPending,
    error,
  } = useClientWorkout(clientId, sessionId);

  if (isPending) {
    return (
      <div className="px-5 py-3">
        <Spinner className="size-4" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="px-5 py-3">
        <ErrorMessage error={error ?? new Error("No se ha podido cargar")} />
      </div>
    );
  }

  // Sets arrive in the order they were trained, so grouping keeps that order.
  const byExercise = new Map<number, typeof session.sets>();
  for (const set of session.sets) {
    byExercise.set(set.order_index, [
      ...(byExercise.get(set.order_index) ?? []),
      set,
    ]);
  }

  return (
    <div className="space-y-3 bg-slate-50 px-5 py-3">
      {session.notes && (
        <p className="text-sm text-slate-600 italic">«{session.notes}»</p>
      )}
      {[...byExercise.values()].map((sets) => (
        <div key={sets[0].order_index}>
          <p className="text-sm font-medium text-slate-800">
            {sets[0].exercise_name}
            {sets[0].target_reps && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                objetivo {sets[0].target_reps}
              </span>
            )}
          </p>
          <p className="text-sm text-slate-500">
            {sets
              .map((set) =>
                set.weight_kg === null
                  ? `${set.reps ?? "?"} reps`
                  : `${set.weight_kg} × ${set.reps ?? "?"}`,
              )
              .join("   ")}
          </p>
        </div>
      ))}
    </div>
  );
}

function SessionRow({
  clientId,
  session,
}: {
  clientId: string;
  session: WorkoutSessionSummary;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-slate-50"
      >
        <span className="min-w-0">
          <span className="block font-medium text-slate-800">
            {session.day_of_week_es} · {formatDate(session.performed_on)}
          </span>
          <span className="block text-sm text-slate-500">
            {session.exercise_count} ejercicios · {session.set_count} series ·{" "}
            {session.total_volume_kg} kg
          </span>
        </span>
        {isOpen ? (
          <ChevronUp className="size-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        )}
      </button>
      {isOpen && <SessionDetail clientId={clientId} sessionId={session.id} />}
    </li>
  );
}

/** What the client actually trained, as opposed to what the plan asked for. */
export function WorkoutsCard({ clientId }: { clientId: string }) {
  const { data: sessions, isPending, error } = useClientWorkouts(clientId);

  return (
    <Card>
      <CardHeader title="Sesiones entrenadas" />
      {error && <ErrorMessage error={error} />}
      {isPending ? (
        <div className="px-5 py-4">
          <Spinner className="size-4" />
        </div>
      ) : sessions && sessions.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              clientId={clientId}
              session={session}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Todavía no ha registrado ninguna sesión"
          description="Cuando entrene desde su enlace, aquí verás los pesos de cada serie."
        />
      )}
    </Card>
  );
}
