"use client";

import { Check, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { exerciseImageUrl } from "@/lib/exercise-image";
import { formatDate } from "@/lib/format";
import {
  formatNumber,
  parseDecimal,
  parseWhole,
} from "@/lib/workout/parse-number";
import type { DraftExercise, DraftSet } from "@/lib/workout/session-draft";

const FIELD_CLASSES =
  "h-11 w-full rounded-lg border border-slate-300 bg-surface text-center text-lg font-semibold text-slate-900 focus:border-amber-500";

function SetRow({
  set,
  onChange,
  onToggle,
  onRemove,
}: {
  set: DraftSet;
  onChange: (patch: Partial<DraftSet>) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2 px-3 py-2",
        set.done && "bg-amber-50",
      )}
    >
      <span className="w-6 shrink-0 text-center text-sm font-semibold text-slate-400">
        {set.setNumber}
      </span>

      <label className="flex-1">
        <span className="sr-only">Peso de la serie {set.setNumber}</span>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumber(set.weightKg)}
          onChange={(event) =>
            onChange({ weightKg: parseDecimal(event.target.value) })
          }
          placeholder="kg"
          className={FIELD_CLASSES}
        />
      </label>

      <span className="text-slate-400">×</span>

      <label className="flex-1">
        <span className="sr-only">
          Repeticiones de la serie {set.setNumber}
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={formatNumber(set.reps)}
          onChange={(event) =>
            onChange({ reps: parseWhole(event.target.value) })
          }
          placeholder="reps"
          className={FIELD_CLASSES}
        />
      </label>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={set.done}
        aria-label={`Marcar la serie ${set.setNumber} como hecha`}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg border transition-colors",
          set.done
            ? "border-amber-500 bg-amber-500 text-white"
            : "border-slate-300 bg-surface text-slate-400 hover:border-amber-400",
        )}
      >
        <Check className="size-5" />
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar la serie ${set.setNumber}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:text-red-500"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

function LastTime({ exercise }: { exercise: DraftExercise }) {
  if (!exercise.lastPerformedOn || exercise.lastSets.length === 0) {
    return (
      <p className="text-sm text-slate-400">Primera vez con este ejercicio.</p>
    );
  }

  const summary = exercise.lastSets
    .map((set) =>
      set.weight_kg === null
        ? `${set.reps ?? "?"}`
        : `${formatNumber(set.weight_kg)}×${set.reps ?? "?"}`,
    )
    .join("  ");

  return (
    <p className="text-sm text-slate-500">
      <span className="font-medium text-slate-600">
        {formatDate(exercise.lastPerformedOn)}:
      </span>{" "}
      {summary}
    </p>
  );
}

export function ExerciseStep({
  exercise,
  onChangeSet,
  onToggleSet,
  onRemoveSet,
  onAddSet,
}: {
  exercise: DraftExercise;
  onChangeSet: (setNumber: number, patch: Partial<DraftSet>) => void;
  onToggleSet: (setNumber: number) => void;
  onRemoveSet: (setNumber: number) => void;
  onAddSet: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-3 border-b border-slate-200 p-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {exercise.imagePath && (
            // eslint-disable-next-line @next/next/no-img-element -- static mount, no loader needed
            <img
              src={exerciseImageUrl(exercise.imagePath)}
              alt={exercise.name}
              className="size-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">{exercise.name}</h2>
          <p className="text-sm text-slate-500">
            {exercise.targetSets} × {exercise.targetReps}
            {exercise.restSeconds ? ` · ${exercise.restSeconds}s descanso` : ""}
          </p>
          <LastTime exercise={exercise} />
        </div>
      </div>

      {exercise.notes && (
        <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          {exercise.notes}
        </p>
      )}

      <ul className="divide-y divide-slate-100">
        {exercise.sets.map((set) => (
          <SetRow
            key={set.setNumber}
            set={set}
            onChange={(patch) => onChangeSet(set.setNumber, patch)}
            onToggle={() => onToggleSet(set.setNumber)}
            onRemove={() => onRemoveSet(set.setNumber)}
          />
        ))}
      </ul>

      <div className="px-3 py-2">
        <Button variant="ghost" size="sm" onClick={onAddSet}>
          <Plus className="size-4" />
          Añadir serie
        </Button>
      </div>
    </Card>
  );
}
