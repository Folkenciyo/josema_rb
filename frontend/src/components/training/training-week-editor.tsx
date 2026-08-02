"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";

import { useExerciseMap } from "@/hooks/use-exercises";
import { useSaveTrainingWeekDays } from "@/hooks/use-training-plans";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import {
  addExercises,
  buildWeekDraft,
  countExercises,
  moveExercise,
  removeExercise,
  updateExercise,
  weekDraftToPayload,
  type ExerciseDraft,
} from "@/lib/training/week-draft";
import type { TrainingWeek } from "@/types/training-plan";
import { TrainingDayEditor } from "./training-day-editor";

interface TrainingWeekEditorProps {
  planId: string;
  week: TrainingWeek;
}

/** Mounted with `key={week.id}` by the parent, so switching weeks resets the draft. */
export function TrainingWeekEditor({ planId, week }: TrainingWeekEditorProps) {
  const { exerciseMap } = useExerciseMap();
  const saveDays = useSaveTrainingWeekDays(planId);

  const [draft, setDraft] = useState(() => buildWeekDraft(week));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(weekDraftToPayload(buildWeekDraft(week))),
  );

  const payload = useMemo(() => weekDraftToPayload(draft), [draft]);
  const isDirty = JSON.stringify(payload) !== savedSnapshot;

  const handleSave = () => {
    saveDays.mutate(
      { weekId: week.id, days: payload },
      { onSuccess: () => setSavedSnapshot(JSON.stringify(payload)) },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {countExercises(draft)} ejercicios en la semana
          {isDirty && (
            <span className="ml-2 font-medium text-amber-600">
              · cambios sin guardar
            </span>
          )}
        </p>
        <Button onClick={handleSave} disabled={!isDirty} loading={saveDays.isPending}>
          <Save className="size-4" />
          Guardar semana
        </Button>
      </div>

      <ErrorMessage error={saveDays.error} />

      <div className="flex flex-col gap-3">
        {draft.map((day) => (
          <TrainingDayEditor
            key={day.day_of_week}
            day={day}
            exerciseMap={exerciseMap}
            onAddExercises={(exerciseIds) =>
              setDraft((current) =>
                addExercises(current, day.day_of_week, exerciseIds),
              )
            }
            onRemoveExercise={(key) =>
              setDraft((current) => removeExercise(current, day.day_of_week, key))
            }
            onUpdateExercise={(key, changes: Partial<Omit<ExerciseDraft, "key">>) =>
              setDraft((current) =>
                updateExercise(current, day.day_of_week, key, changes),
              )
            }
            onMoveExercise={(fromIndex, toIndex) =>
              setDraft((current) =>
                moveExercise(current, day.day_of_week, fromIndex, toIndex),
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
