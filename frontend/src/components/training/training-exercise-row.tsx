"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { ExerciseDraft } from "@/lib/training/week-draft";
import type { Exercise } from "@/types/exercise";
import { ExerciseImage } from "@/components/exercises/exercise-image";
import { cn } from "@/lib/cn";

interface TrainingExerciseRowProps {
  draft: ExerciseDraft;
  exercise: Exercise | undefined;
  /** "A1"/"A2" when the exercise is half of a superset. */
  label?: string;
  /** Only a lone exercise carries the handle: a superset is dragged as a block. */
  dragHandle?: ReactNode;
  onChange: (changes: Partial<Omit<ExerciseDraft, "key">>) => void;
  onRemove: () => void;
}

function numberOrNull(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

function textOrNull(value: string): string | null {
  return value.trim() === "" ? null : value;
}

export function TrainingExerciseRow({
  draft,
  exercise,
  label,
  dragHandle,
  onChange,
  onRemove,
}: TrainingExerciseRowProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={cn(label && "border-l border-slate-200 pl-2")}>
      <div className="flex items-center gap-2">
        {dragHandle}

        {label && (
          <span className="bg-brand-50 text-brand-700 rounded px-1.5 py-0.5 text-xs font-bold">
            {label}
          </span>
        )}

        <ExerciseImage
          path={exercise?.images[0]}
          alt={exercise?.name_es ?? ""}
          className="size-10 shrink-0 rounded"
        />

        <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
          {exercise?.name_es ?? draft.exercise_id}
        </p>

        <label className="flex items-center gap-1 text-xs text-slate-500">
          Series
          <Input
            type="number"
            min={1}
            value={draft.sets}
            onChange={(event) => onChange({ sets: Number(event.target.value) })}
            className="h-8 w-16 px-2"
          />
        </label>

        <label className="flex items-center gap-1 text-xs text-slate-500">
          Reps
          <Input
            value={draft.reps}
            onChange={(event) => onChange({ reps: event.target.value })}
            placeholder="8-12"
            className="h-8 w-20 px-2"
          />
        </label>

        <label className="hidden items-center gap-1 text-xs text-slate-500 sm:flex">
          Descanso
          <Input
            type="number"
            min={0}
            step={5}
            value={draft.rest_seconds ?? ""}
            onChange={(event) =>
              onChange({ rest_seconds: numberOrNull(event.target.value) })
            }
            placeholder="s"
            className="h-8 w-20 px-2"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowDetails((current) => !current)}
          aria-expanded={showDetails}
          aria-label="Más opciones"
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              showDetails && "rotate-180",
            )}
          />
        </button>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${exercise?.name_es ?? "ejercicio"}`}
          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {showDetails && (
        <div className="mt-2 grid gap-2 border-t border-slate-100 pt-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-slate-500 sm:hidden">
            Descanso (s)
            <Input
              type="number"
              min={0}
              step={5}
              value={draft.rest_seconds ?? ""}
              onChange={(event) =>
                onChange({ rest_seconds: numberOrNull(event.target.value) })
              }
              className="h-8"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Tempo
            <Input
              value={draft.tempo ?? ""}
              onChange={(event) =>
                onChange({ tempo: textOrNull(event.target.value) })
              }
              placeholder="3-1-1"
              className="h-8"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
            Notas
            <Input
              value={draft.notes ?? ""}
              onChange={(event) =>
                onChange({ notes: textOrNull(event.target.value) })
              }
              className="h-8"
            />
          </label>
        </div>
      )}
    </div>
  );
}
