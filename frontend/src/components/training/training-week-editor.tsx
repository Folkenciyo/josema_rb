"use client";

import { useEffect, useMemo, useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";
import { useExerciseMap } from "@/hooks/use-exercises";
import { useSaveTrainingWeekDays } from "@/hooks/use-training-plans";
import { ErrorMessage } from "@/components/ui/feedback";
import {
  addExercises,
  addSupersetExercises,
  buildWeekDraft,
  countExercises,
  moveBlock,
  removeExercise,
  setDayNotes,
  setMeasurement,
  setSupersetNote,
  swapDays,
  ungroupSuperset,
  updateExercise,
  weekDraftToPayload,
  type ExerciseDraft,
} from "@/lib/training/week-draft";
import type { ExerciseMeasurement } from "@/types/common";
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
  const debouncedPayload = useDebounce(payload, 800);

  // Autosaves so the routine survives every change without a save click.
  useEffect(() => {
    const debouncedSnapshot = JSON.stringify(debouncedPayload);
    if (debouncedSnapshot === savedSnapshot) {
      return;
    }
    saveDays.mutate(
      { weekId: week.id, days: debouncedPayload },
      { onSuccess: () => setSavedSnapshot(debouncedSnapshot) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPayload]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {countExercises(draft)} ejercicios en la semana
          {saveDays.isPending || isDirty ? (
            <span className="text-brand-600 ml-2 font-medium">
              · guardando...
            </span>
          ) : (
            <span className="ml-2 text-slate-400">· guardado</span>
          )}
        </p>
      </div>

      <ErrorMessage error={saveDays.error} />

      <div className="flex flex-col gap-3">
        {draft.map((day, index) => (
          <TrainingDayEditor
            key={day.day_of_week}
            day={day}
            exerciseMap={exerciseMap}
            onAddExercises={(exerciseIds) =>
              setDraft((current) =>
                addExercises(current, day.day_of_week, exerciseIds),
              )
            }
            onAddSuperset={(exerciseIds) =>
              setDraft((current) =>
                addSupersetExercises(current, day.day_of_week, exerciseIds),
              )
            }
            onRemoveExercise={(key) =>
              setDraft((current) =>
                removeExercise(current, day.day_of_week, key),
              )
            }
            onChangeNotes={(notes) =>
              setDraft((current) =>
                setDayNotes(current, day.day_of_week, notes),
              )
            }
            onUngroupSuperset={(group) =>
              setDraft((current) =>
                ungroupSuperset(current, day.day_of_week, group),
              )
            }
            onChangeSupersetNote={(group, note) =>
              setDraft((current) =>
                setSupersetNote(current, day.day_of_week, group, note),
              )
            }
            onUpdateExercise={(
              key,
              changes: Partial<Omit<ExerciseDraft, "key">>,
            ) =>
              setDraft((current) =>
                updateExercise(current, day.day_of_week, key, changes),
              )
            }
            onChangeMeasurement={(key, measurement: ExerciseMeasurement) =>
              setDraft((current) =>
                setMeasurement(current, day.day_of_week, key, measurement),
              )
            }
            onMoveBlock={(fromIndex, toIndex) =>
              setDraft((current) =>
                moveBlock(current, day.day_of_week, fromIndex, toIndex),
              )
            }
            onMoveDayUp={
              index > 0
                ? () =>
                    setDraft((current) =>
                      swapDays(
                        current,
                        day.day_of_week,
                        current[index - 1].day_of_week,
                      ),
                    )
                : undefined
            }
            onMoveDayDown={
              index < draft.length - 1
                ? () =>
                    setDraft((current) =>
                      swapDays(
                        current,
                        day.day_of_week,
                        current[index + 1].day_of_week,
                      ),
                    )
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
