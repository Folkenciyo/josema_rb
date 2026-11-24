"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ListChecks, StickyNote, Trash2 } from "lucide-react";

import { Input, Select } from "@/components/ui/input";
import type { ExerciseDraft } from "@/lib/training/week-draft";
import type { Exercise } from "@/types/exercise";
import {
  SET_MODIFIER_LABELS,
  type ExerciseMeasurement,
  type SetModifier,
} from "@/types/common";
import type { PlannedSet } from "@/types/training-plan";
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
  onChangeMeasurement: (measurement: ExerciseMeasurement) => void;
  onSetSetsCount: (sets: number) => void;
  onTogglePlannedSets: () => void;
  onUpdatePlannedSet: (
    setNumber: number,
    changes: Partial<Omit<PlannedSet, "set_number">>,
  ) => void;
  onApplyToAllSets: (setNumber: number) => void;
  onRemove: () => void;
}

// A thumb needs 44px; a mouse is happy with the compact desktop sizes.
const ICON_BUTTON =
  "flex size-11 shrink-0 items-center justify-center rounded sm:size-auto";
// `max-sm:` rather than a bare class: a variant always wins over the base
// height the shared control already carries, whatever order the CSS lands in.
const FIELD_HEIGHT = "h-8 max-sm:h-11";

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
  onChangeMeasurement,
  onSetSetsCount,
  onTogglePlannedSets,
  onUpdatePlannedSet,
  onApplyToAllSets,
  onRemove,
}: TrainingExerciseRowProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={cn(label && "border-l border-slate-200 pl-2")}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
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

        {/* Two lines rather than an ellipsis: "Círculos de Br…" names nothing. */}
        <p className="line-clamp-2 min-w-0 flex-1 text-sm font-medium break-words text-slate-800">
          {exercise?.name_es ?? draft.exercise_id}
        </p>

        {/* On a phone the numbers and the option toggles leave the name its
            line: numbers below it, the toggles beside the note. */}
        <div className="order-1 flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 sm:order-none sm:w-auto sm:flex-nowrap sm:gap-x-2">
          <label className="order-1 flex items-center gap-1 text-xs text-slate-500 sm:order-none">
            Series
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={draft.sets}
              onChange={(event) => onSetSetsCount(Number(event.target.value))}
              className={cn(FIELD_HEIGHT, "w-16! px-2")}
            />
          </label>

          <div className="order-3 flex items-center gap-1 text-xs text-slate-500 sm:order-none">
            <div className="flex overflow-hidden rounded border border-slate-300">
              <button
                type="button"
                onClick={() => onChangeMeasurement("reps")}
                aria-pressed={draft.measurement === "reps"}
                className={cn(
                  "h-11 px-3 sm:h-auto sm:px-1.5 sm:py-1.5",
                  draft.measurement === "reps"
                    ? "bg-brand-600 text-white"
                    : "bg-surface hover:bg-slate-50",
                )}
              >
                Reps
              </button>
              <button
                type="button"
                onClick={() => onChangeMeasurement("time")}
                aria-pressed={draft.measurement === "time"}
                className={cn(
                  "h-11 border-l border-slate-300 px-3 sm:h-auto sm:px-1.5 sm:py-1.5",
                  draft.measurement === "time"
                    ? "bg-brand-600 text-white"
                    : "bg-surface hover:bg-slate-50",
                )}
              >
                Tiempo
              </button>
            </div>

            {draft.measurement === "reps" ? (
              <label>
                <span className="sr-only">Repeticiones</span>
                <Input
                  value={draft.reps ?? ""}
                  onChange={(event) => onChange({ reps: event.target.value })}
                  placeholder="8-12"
                  className={cn(FIELD_HEIGHT, "w-20! px-2")}
                />
              </label>
            ) : (
              <label>
                <span className="sr-only">Segundos</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={draft.duration_seconds ?? ""}
                  onChange={(event) =>
                    onChange({
                      duration_seconds: numberOrNull(event.target.value),
                    })
                  }
                  placeholder="s"
                  className={cn(FIELD_HEIGHT, "w-16! px-2")}
                />
              </label>
            )}
          </div>

          <label className="order-2 flex items-center gap-1 text-xs text-slate-500 sm:order-none">
            Descanso
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={5}
              value={draft.rest_seconds ?? ""}
              onChange={(event) =>
                onChange({ rest_seconds: numberOrNull(event.target.value) })
              }
              placeholder="s"
              className={cn(FIELD_HEIGHT, "w-20! px-2")}
            />
          </label>
        </div>

        <div className="order-3 flex items-center gap-1 sm:order-none sm:gap-2">
          <button
            type="button"
            onClick={onTogglePlannedSets}
            aria-pressed={draft.planned_sets !== null}
            title="Personalizar series: reps y al fallo/RIR de cada una"
            className={cn(
              ICON_BUTTON,
              "sm:p-1.5",
              draft.planned_sets !== null
                ? "text-brand-600 bg-brand-50"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
            )}
          >
            <ListChecks className="size-5 sm:size-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            aria-expanded={showDetails}
            aria-label="Más opciones"
            className={cn(
              ICON_BUTTON,
              "text-slate-400 hover:bg-slate-100 hover:text-slate-600 sm:p-1",
            )}
          >
            <ChevronDown
              className={cn(
                "size-5 transition-transform sm:size-4",
                showDetails && "rotate-180",
              )}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${exercise?.name_es ?? "ejercicio"}`}
          className={cn(
            ICON_BUTTON,
            "text-slate-400 hover:bg-red-50 hover:text-red-600 sm:p-1",
          )}
        >
          <Trash2 className="size-5 sm:size-4" />
        </button>

        <label className="order-2 flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-500 sm:order-last sm:w-full sm:flex-none">
          <StickyNote className="size-3.5 shrink-0 text-slate-400" />
          <span className="sr-only">
            Nota para {exercise?.name_es ?? "el ejercicio"}
          </span>
          <Input
            value={draft.notes ?? ""}
            onChange={(event) =>
              onChange({ notes: textOrNull(event.target.value) })
            }
            placeholder="Nota para el cliente: técnica, sensaciones, avisos…"
            className={cn(FIELD_HEIGHT, "flex-1")}
          />
        </label>
      </div>

      {draft.planned_sets !== null && (
        <ul className="mt-2 flex flex-col gap-1 border-t border-slate-100 pt-2">
          {draft.planned_sets.map((set) => (
            <li
              key={set.set_number}
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="w-12 shrink-0 text-xs text-slate-500">
                Serie {set.set_number}
              </span>

              {draft.measurement === "reps" ? (
                <Input
                  value={set.reps ?? ""}
                  onChange={(event) =>
                    onUpdatePlannedSet(set.set_number, {
                      reps: textOrNull(event.target.value),
                    })
                  }
                  placeholder="8-12"
                  className={cn(FIELD_HEIGHT, "w-20! px-2")}
                  aria-label={`Repeticiones de la serie ${set.set_number}`}
                />
              ) : (
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={set.duration_seconds ?? ""}
                  onChange={(event) =>
                    onUpdatePlannedSet(set.set_number, {
                      duration_seconds: numberOrNull(event.target.value),
                    })
                  }
                  placeholder="s"
                  className={cn(FIELD_HEIGHT, "w-16! px-2")}
                  aria-label={`Segundos de la serie ${set.set_number}`}
                />
              )}

              <Select
                value={set.modifier}
                onChange={(event) =>
                  onUpdatePlannedSet(set.set_number, {
                    modifier: event.target.value as SetModifier,
                    rir_value:
                      event.target.value === "rir"
                        ? (set.rir_value ?? 2)
                        : null,
                  })
                }
                className={cn(FIELD_HEIGHT, "w-28 px-2 text-xs")}
                aria-label={`Tipo de la serie ${set.set_number}`}
              >
                {Object.entries(SET_MODIFIER_LABELS).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </Select>

              {set.modifier === "rir" && (
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10}
                  value={set.rir_value ?? ""}
                  onChange={(event) =>
                    onUpdatePlannedSet(set.set_number, {
                      rir_value: numberOrNull(event.target.value),
                    })
                  }
                  className={cn(FIELD_HEIGHT, "w-14 px-2")}
                  aria-label={`Repeticiones en reserva de la serie ${set.set_number}`}
                />
              )}

              <button
                type="button"
                onClick={() => onApplyToAllSets(set.set_number)}
                title="Aplicar esta serie a todas las demás"
                className="h-11 px-1 text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline sm:h-auto sm:px-0"
              >
                Aplicar a todas
              </button>
            </li>
          ))}
        </ul>
      )}

      {showDetails && (
        <div className="mt-2 grid gap-2 border-t border-slate-100 pt-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-slate-500 sm:hidden">
            Descanso (s)
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={5}
              value={draft.rest_seconds ?? ""}
              onChange={(event) =>
                onChange({ rest_seconds: numberOrNull(event.target.value) })
              }
              className={FIELD_HEIGHT}
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
              className={FIELD_HEIGHT}
            />
          </label>
        </div>
      )}
    </div>
  );
}
