"use client";

import { useState } from "react";
import { Check, Dumbbell, Info, Plus, Trash2 } from "lucide-react";

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
import { PortalExerciseModal } from "../portal-exercise-modal";

const FIELD_CLASSES =
  "h-11 w-full rounded-lg border border-slate-300 bg-surface text-center text-lg font-semibold text-slate-900 focus:border-brand-600";

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
  // Decoupled from `set.weightKg` while typing: re-deriving the text from the
  // parsed number on every keystroke would erase a decimal separator the
  // moment it's typed ("9." parses to 9, which formats right back to "9").
  const [weightText, setWeightText] = useState(formatNumber(set.weightKg));

  return (
    <li
      className={cn(
        "flex items-center gap-2 px-3 py-2",
        set.done && "bg-brand-50",
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
          value={weightText}
          onChange={(event) => {
            setWeightText(event.target.value);
            onChange({ weightKg: parseDecimal(event.target.value) });
          }}
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
            ? "border-brand-600 bg-brand-600 text-white"
            : "bg-surface hover:border-brand-500 border-slate-300 text-slate-400",
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
  token,
  exercise,
  onChangeSet,
  onToggleSet,
  onRemoveSet,
  onAddSet,
}: {
  token: string;
  exercise: DraftExercise;
  onChangeSet: (setNumber: number, patch: Partial<DraftSet>) => void;
  onToggleSet: (setNumber: number) => void;
  onRemoveSet: (setNumber: number) => void;
  onAddSet: () => void;
}) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  // A session parked by an older version of the app has no catalogue id, and
  // there is nothing to look the sheet up by.
  const canOpenSheet = exercise.exerciseId !== null;

  const heading = (
    <>
      <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {exercise.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element -- static mount, no loader needed
          <img
            src={exerciseImageUrl(exercise.imagePath)}
            alt={exercise.name}
            className="size-full object-cover"
          />
        ) : (
          // Part of the catalogue has no photo; an empty box reads as broken.
          <span className="flex size-full items-center justify-center text-slate-300">
            <Dumbbell className="size-7" />
          </span>
        )}
      </div>
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 font-semibold text-slate-900">
          {exercise.supersetLabel && (
            <span className="bg-brand-50 text-brand-700 rounded px-1.5 py-0.5 text-xs font-bold">
              {exercise.supersetLabel}
            </span>
          )}
          <span className="min-w-0">{exercise.name}</span>
          {canOpenSheet && <Info className="text-brand-600 size-4 shrink-0" />}
        </h2>
        <p className="text-sm text-slate-500">
          {exercise.targetSets} × {exercise.targetReps}
          {exercise.restSeconds && !exercise.chainedTo
            ? ` · ${exercise.restSeconds}s descanso`
            : ""}
        </p>
        <LastTime exercise={exercise} />
      </div>
    </>
  );

  return (
    <Card className="overflow-hidden">
      {canOpenSheet ? (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full gap-3 border-b border-slate-200 p-4 text-left hover:bg-slate-50"
        >
          {heading}
        </button>
      ) : (
        <div className="flex gap-3 border-b border-slate-200 p-4">
          {heading}
        </div>
      )}

      {exercise.supersetNote && (
        <p className="border-brand-600 border-b border-l-4 border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          {exercise.supersetNote}
        </p>
      )}

      {exercise.chainedTo && (
        <p className="border-brand-600 border-b border-l-4 border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-600">
          Sin descanso: encadena con <strong>{exercise.chainedTo}</strong>.
        </p>
      )}

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

      {isSheetOpen && exercise.exerciseId && (
        <PortalExerciseModal
          token={token}
          exerciseId={exercise.exerciseId}
          name={exercise.name}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </Card>
  );
}
