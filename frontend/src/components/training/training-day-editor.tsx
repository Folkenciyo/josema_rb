"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronUp, Link2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExercisePickerDrawer } from "@/components/exercises/exercise-picker-drawer";
import { dayBlocks, type DayDraft, type ExerciseDraft } from "@/lib/training/week-draft";
import { DAY_LABELS, type ExerciseMeasurement } from "@/types/common";
import type { Exercise } from "@/types/exercise";
import { TrainingBlock } from "./training-block";

type PickerMode = "single" | "superset";

interface TrainingDayEditorProps {
  day: DayDraft;
  exerciseMap: Map<string, Exercise>;
  onAddExercises: (exerciseIds: string[]) => void;
  onAddSuperset: (exerciseIds: string[]) => void;
  onRemoveExercise: (key: string) => void;
  onChangeNotes: (notes: string) => void;
  onUngroupSuperset: (group: number) => void;
  onChangeSupersetNote: (group: number, note: string | null) => void;
  onUpdateExercise: (
    key: string,
    changes: Partial<Omit<ExerciseDraft, "key">>,
  ) => void;
  onChangeMeasurement: (key: string, measurement: ExerciseMeasurement) => void;
  onMoveBlock: (fromIndex: number, toIndex: number) => void;
  /** Swaps this day's whole content with the day above/below it in the week. */
  onMoveDayUp?: () => void;
  onMoveDayDown?: () => void;
}

export function TrainingDayEditor({
  day,
  exerciseMap,
  onAddExercises,
  onAddSuperset,
  onRemoveExercise,
  onChangeNotes,
  onUngroupSuperset,
  onChangeSupersetNote,
  onUpdateExercise,
  onChangeMeasurement,
  onMoveBlock,
  onMoveDayUp,
  onMoveDayDown,
}: TrainingDayEditorProps) {
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const blocks = dayBlocks(day);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const fromIndex = blocks.findIndex(
      (block) => block.exercises[0].key === active.id,
    );
    const toIndex = blocks.findIndex(
      (block) => block.exercises[0].key === over.id,
    );
    onMoveBlock(fromIndex, toIndex);
  };

  const dayLabel = DAY_LABELS[day.day_of_week];

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={onMoveDayUp}
              disabled={!onMoveDayUp}
              aria-label={`Cambiar ${dayLabel} por el día anterior`}
              title="Cambiar por el día anterior"
              className="text-slate-400 enabled:hover:text-brand-600 disabled:opacity-20"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={onMoveDayDown}
              disabled={!onMoveDayDown}
              aria-label={`Cambiar ${dayLabel} por el día siguiente`}
              title="Cambiar por el día siguiente"
              className="text-slate-400 enabled:hover:text-brand-600 disabled:opacity-20"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
          <h3 className="font-semibold text-slate-800">
            {dayLabel}
            {day.exercises.length === 0 && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                Descanso
              </span>
            )}
          </h3>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPickerMode("superset")}
            title="Dos ejercicios encadenados, sin descanso entre ellos"
          >
            <Link2 className="size-4" />
            Superserie
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPickerMode("single")}
          >
            <Plus className="size-4" />
            Añadir
          </Button>
        </div>
      </div>

      {/* The instruction for the day as a whole, above the exercises it frames. */}
      <textarea
        value={day.notes ?? ""}
        onChange={(event) => onChangeNotes(event.target.value)}
        rows={2}
        placeholder={`Nota del ${dayLabel.toLowerCase()} — lo que quieres que haga ese día`}
        className="focus:border-brand-400 mb-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
      />

      {blocks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((block) => block.exercises[0].key)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {blocks.map((block) => (
                <TrainingBlock
                  key={block.exercises[0].key}
                  block={block}
                  exerciseMap={exerciseMap}
                  onChangeExercise={onUpdateExercise}
                  onChangeMeasurement={onChangeMeasurement}
                  onRemoveExercise={onRemoveExercise}
                  onUngroup={onUngroupSuperset}
                  onChangeSupersetNote={onChangeSupersetNote}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {pickerMode !== null && (
        <ExercisePickerDrawer
          title={
            pickerMode === "superset"
              ? `Nueva superserie · ${dayLabel}`
              : `Añadir ejercicios · ${dayLabel}`
          }
          hint={
            pickerMode === "superset"
              ? "Elige los ejercicios que se harán encadenados, en el orden en que se hacen."
              : undefined
          }
          minSelection={pickerMode === "superset" ? 2 : 1}
          onClose={() => setPickerMode(null)}
          onConfirm={pickerMode === "superset" ? onAddSuperset : onAddExercises}
        />
      )}
    </section>
  );
}
