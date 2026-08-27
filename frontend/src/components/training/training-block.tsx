"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, StickyNote, Unlink } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { supersetNoteOf, type ExerciseDraft } from "@/lib/training/week-draft";
import type { SupersetBlock } from "@/lib/training/supersets";
import type { Exercise } from "@/types/exercise";
import { TrainingExerciseRow } from "./training-exercise-row";

interface TrainingBlockProps {
  block: SupersetBlock<ExerciseDraft>;
  exerciseMap: Map<string, Exercise>;
  onChangeExercise: (
    key: string,
    changes: Partial<Omit<ExerciseDraft, "key">>,
  ) => void;
  onRemoveExercise: (key: string) => void;
  onUngroup: (group: number) => void;
  onChangeSupersetNote: (group: number, note: string | null) => void;
}

/**
 * One draggable unit of the day: a single exercise, or the two (or more) that
 * are done back to back. A superset moves as a whole — dragging half of it out
 * would leave the other half chained to nothing.
 */
export function TrainingBlock({
  block,
  exerciseMap,
  onChangeExercise,
  onRemoveExercise,
  onUngroup,
  onChangeSupersetNote,
}: TrainingBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.exercises[0].key });

  const isSuperset = block.letter !== null;

  const dragHandle = (
    <button
      type="button"
      aria-label={
        isSuperset
          ? `Reordenar superserie ${block.letter}`
          : "Reordenar ejercicio"
      }
      className="cursor-grab touch-none p-1 text-slate-400 hover:text-slate-600"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );

  if (!isSuperset) {
    return (
      <li
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          "bg-surface rounded-lg border border-slate-200 p-2",
          isDragging && "z-10 shadow-lg",
        )}
      >
        <TrainingExerciseRow
          draft={block.exercises[0]}
          exercise={exerciseMap.get(block.exercises[0].exercise_id)}
          dragHandle={dragHandle}
          onChange={(changes) =>
            onChangeExercise(block.exercises[0].key, changes)
          }
          onRemove={() => onRemoveExercise(block.exercises[0].key)}
        />
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "border-brand-600 bg-surface rounded-lg border border-l-4 border-slate-200 p-2",
        isDragging && "z-10 shadow-lg",
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        {dragHandle}
        <p className="flex-1 text-xs font-semibold text-slate-600">
          Superserie {block.letter}
          <span className="ml-2 font-normal text-slate-400">
            sin descanso entre ejercicios
          </span>
        </p>
        <button
          type="button"
          onClick={() => onUngroup(block.group as number)}
          className="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <Unlink className="size-3.5" />
          Separar
        </button>
      </div>

      {/* The note about the pair, not about either half of it. */}
      <label className="mb-2 flex items-center gap-2 text-xs text-slate-500">
        <StickyNote className="size-3.5 shrink-0 text-slate-400" />
        <span className="sr-only">Nota de la superserie {block.letter}</span>
        <Input
          value={supersetNoteOf(block.exercises) ?? ""}
          onChange={(event) =>
            onChangeSupersetNote(
              block.group as number,
              event.target.value.trim() === "" ? null : event.target.value,
            )
          }
          placeholder="Nota de la superserie: cómo encadenarlas, qué cuidar…"
          className="h-8 flex-1"
        />
      </label>

      <div className="flex flex-col gap-2">
        {block.exercises.map((draft, index) => (
          <TrainingExerciseRow
            key={draft.key}
            draft={draft}
            exercise={exerciseMap.get(draft.exercise_id)}
            label={`${block.letter}${index + 1}`}
            onChange={(changes) => onChangeExercise(draft.key, changes)}
            onRemove={() => onRemoveExercise(draft.key)}
          />
        ))}
      </div>
    </li>
  );
}
