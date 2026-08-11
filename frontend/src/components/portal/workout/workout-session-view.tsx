"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Flag, Play } from "lucide-react";

import {
  useWorkoutDay,
  useWorkoutState,
  useWorkoutSync,
} from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/feedback";
import {
  completedSets,
  createDraft,
  addSet as draftAddSet,
  removeSet as draftRemoveSet,
  setNotes as draftSetNotes,
  updateSet as draftUpdateSet,
  isEmpty,
  toPayload,
  totalVolume,
  type DraftSet,
  type SessionDraft,
} from "@/lib/workout/session-draft";
import {
  discardDraft,
  queueSession,
  setDraft,
} from "@/lib/workout/session-store";
import { localDateISO } from "@/lib/workout/today";
import { formatNumber } from "@/lib/workout/parse-number";
import { portalPath } from "@/types/portal";
import type { WorkoutDayDetail } from "@/types/workout";
import { PortalLoading, PortalNotice, PortalPage } from "../portal-shell";
import { ExerciseStep } from "./exercise-step";
import { RestTimer } from "./rest-timer";

/** Where to pick up a session that was interrupted: the first set still open. */
function firstUnfinished(draft: SessionDraft): number {
  const index = draft.exercises.findIndex((exercise) =>
    exercise.sets.some((set) => !set.done),
  );
  return index === -1 ? Math.max(draft.exercises.length - 1, 0) : index;
}

function StartScreen({
  day,
  hasDraft,
  onStart,
}: {
  day: WorkoutDayDetail;
  hasDraft: boolean;
  onStart: () => void;
}) {
  return (
    <>
      <Card className="px-5 py-4">
        <p className="text-sm text-slate-500">{day.plan_title}</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {day.day_of_week_es}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {day.exercises.length} ejercicios · semana {day.week_number}
        </p>
      </Card>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-surface">
        {day.exercises.map((exercise) => (
          <li key={exercise.id} className="px-4 py-3">
            <p className="font-medium text-slate-800">{exercise.name_es}</p>
            <p className="text-sm text-slate-500">
              {exercise.sets} × {exercise.reps}
            </p>
          </li>
        ))}
      </ul>

      <Button className="h-12 w-full text-base" onClick={onStart}>
        <Play className="size-5" />
        {hasDraft ? "Continuar la sesión" : "Empezar"}
      </Button>
    </>
  );
}

function SummaryScreen({
  draft,
  onNotes,
  onBack,
  onSave,
  isSaving,
}: {
  draft: SessionDraft;
  onNotes: (notes: string) => void;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <>
      <Card className="px-5 py-4">
        <h2 className="font-semibold text-slate-900">Resumen de la sesión</h2>
        <p className="mt-1 text-sm text-slate-500">
          {completedSets(draft)} series · {formatNumber(totalVolume(draft))} kg
          movidos
        </p>
      </Card>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Notas para tu entrenador
        </span>
        <textarea
          value={draft.notes}
          onChange={(event) => onNotes(event.target.value)}
          rows={3}
          placeholder="Cómo te has encontrado, molestias, lo que quieras contar."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
        />
      </label>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onBack}>
          <ChevronLeft className="size-4" />
          Volver
        </Button>
        <Button
          className="flex-1"
          onClick={onSave}
          loading={isSaving}
          disabled={isEmpty(draft)}
        >
          Guardar sesión
        </Button>
      </div>

      {isEmpty(draft) && (
        <p className="text-center text-sm text-slate-500">
          Marca al menos una serie para poder guardar.
        </p>
      )}
    </>
  );
}

export function WorkoutSessionView({
  token,
  dayId,
}: {
  token: string;
  dayId: string;
}) {
  const router = useRouter();
  const { data: day, isPending, error } = useWorkoutDay(token, dayId);
  const { draft } = useWorkoutState();
  const { flush, isSending } = useWorkoutSync(token);

  const [step, setStep] = useState<number | "summary" | null>(null);
  // The id restarts the countdown: two sets in a row rest the same seconds, and
  // the timer has to start over rather than carry on from where it was.
  const [rest, setRest] = useState<{ seconds: number; id: number } | null>(
    null,
  );

  const current = draft && draft.dayId === dayId ? draft : null;

  const start = useCallback(() => {
    if (current) {
      setStep(firstUnfinished(current));
      return;
    }
    if (!day) {
      return;
    }
    const fresh = createDraft(
      day,
      crypto.randomUUID(),
      new Date().toISOString(),
    );
    setDraft(fresh);
    setStep(0);
  }, [current, day]);

  const save = useCallback(() => {
    if (!current) {
      return;
    }
    queueSession(
      toPayload(current, localDateISO(new Date())),
      new Date().toISOString(),
    );
    void flush();
    router.push(`${portalPath(token)}/entreno`);
  }, [current, flush, router, token]);

  if (isPending) {
    return (
      <PortalPage>
        <PortalLoading />
      </PortalPage>
    );
  }

  if (error || !day) {
    return (
      <PortalPage>
        <PortalNotice
          title="No hemos encontrado esta sesión"
          description="Puede que tu entrenador haya cambiado la rutina. Vuelve atrás y elige otro día."
        />
      </PortalPage>
    );
  }

  if (step === null) {
    return (
      <PortalPage>
        <StartScreen day={day} hasDraft={current !== null} onStart={start} />
      </PortalPage>
    );
  }

  if (!current) {
    return (
      <PortalPage>
        <ErrorMessage error={new Error("La sesión se ha perdido.")} />
      </PortalPage>
    );
  }

  if (step === "summary") {
    return (
      <PortalPage>
        <SummaryScreen
          draft={current}
          onNotes={(notes) => setDraft(draftSetNotes(current, notes))}
          onBack={() => setStep(current.exercises.length - 1)}
          onSave={save}
          isSaving={isSending}
        />
      </PortalPage>
    );
  }

  const exercise = current.exercises[step];
  const isLast = step === current.exercises.length - 1;

  const toggleSet = (setNumber: number) => {
    const set = exercise.sets.find((item) => item.setNumber === setNumber);
    const done = !set?.done;
    setDraft(draftUpdateSet(current, step, setNumber, { done }));
    // Ticking a set off is what starts the rest; unticking a mistake does not.
    if (done && exercise.restSeconds) {
      setRest({ seconds: exercise.restSeconds, id: Date.now() });
    }
  };

  return (
    <PortalPage>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(step === 0 ? null : step - 1)}
          className="flex items-center gap-1 text-sm font-medium text-slate-500"
        >
          <ChevronLeft className="size-4" />
          Atrás
        </button>
        <span className="text-sm text-slate-500">
          Ejercicio {step + 1} de {current.exercises.length}
        </span>
      </div>

      <ExerciseStep
        exercise={exercise}
        onChangeSet={(setNumber, patch: Partial<DraftSet>) =>
          setDraft(draftUpdateSet(current, step, setNumber, patch))
        }
        onToggleSet={toggleSet}
        onRemoveSet={(setNumber) =>
          setDraft(draftRemoveSet(current, step, setNumber))
        }
        onAddSet={() => setDraft(draftAddSet(current, step))}
      />

      <Button
        className="h-12 w-full text-base"
        onClick={() => setStep(isLast ? "summary" : step + 1)}
      >
        {isLast ? (
          <>
            <Flag className="size-5" />
            Terminar
          </>
        ) : (
          <>
            Siguiente
            <ChevronRight className="size-5" />
          </>
        )}
      </Button>

      <button
        type="button"
        onClick={() => {
          discardDraft();
          setStep(null);
        }}
        className="text-center text-sm text-slate-400 underline"
      >
        Descartar esta sesión
      </button>

      {rest !== null && (
        <RestTimer
          key={rest.id}
          seconds={rest.seconds}
          onDone={() => setRest(null)}
        />
      )}
    </PortalPage>
  );
}
