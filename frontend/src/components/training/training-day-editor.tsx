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
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ExercisePickerDrawer } from "@/components/exercises/exercise-picker-drawer";
import type { DayDraft, ExerciseDraft } from "@/lib/training/week-draft";
import { DAY_LABELS } from "@/types/common";
import type { Exercise } from "@/types/exercise";
import { TrainingExerciseRow } from "./training-exercise-row";

interface TrainingDayEditorProps {
  day: DayDraft;
  exerciseMap: Map<string, Exercise>;
  onAddExercises: (exerciseIds: string[]) => void;
  onRemoveExercise: (key: string) => void;
  onUpdateExercise: (
    key: string,
    changes: Partial<Omit<ExerciseDraft, "key">>,
  ) => void;
  onMoveExercise: (fromIndex: number, toIndex: number) => void;
}

export function TrainingDayEditor({
  day,
  exerciseMap,
  onAddExercises,
  onRemoveExercise,
  onUpdateExercise,
  onMoveExercise,
}: TrainingDayEditorProps) {
  const [isPickerOpen, setPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const fromIndex = day.exercises.findIndex((item) => item.key === active.id);
    const toIndex = day.exercises.findIndex((item) => item.key === over.id);
    onMoveExercise(fromIndex, toIndex);
  };

  const dayLabel = DAY_LABELS[day.day_of_week];

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-800">
          {dayLabel}
          {day.exercises.length === 0 && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              Descanso
            </span>
          )}
        </h3>
        <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>
          <Plus className="size-4" />
          Añadir
        </Button>
      </div>

      {day.exercises.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={day.exercises.map((item) => item.key)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-2">
              {day.exercises.map((draft) => (
                <TrainingExerciseRow
                  key={draft.key}
                  draft={draft}
                  exercise={exerciseMap.get(draft.exercise_id)}
                  onChange={(changes) => onUpdateExercise(draft.key, changes)}
                  onRemove={() => onRemoveExercise(draft.key)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {isPickerOpen && (
        <ExercisePickerDrawer
          title={`Añadir ejercicios · ${dayLabel}`}
          onClose={() => setPickerOpen(false)}
          onConfirm={onAddExercises}
        />
      )}
    </section>
  );
}
