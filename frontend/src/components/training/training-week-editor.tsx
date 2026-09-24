"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";
import { useExerciseMap } from "@/hooks/use-exercises";
import { useSaveTrainingWeekDays } from "@/hooks/use-training-plans";
import { ErrorMessage } from "@/components/ui/feedback";
import {
  addExercises,
  addSupersetExercises,
  applyToAllSets,
  buildWeekDraft,
  countExercises,
  moveBlock,
  removeExercise,
  setDayNotes,
  setMeasurement,
  setSetsCount,
  setSupersetNote,
  swapDays,
  togglePlannedSets,
  ungroupSuperset,
  updateExercise,
  updatePlannedSet,
  weekDraftToPayload,
  type ExerciseDraft,
} from "@/lib/training/week-draft";
import type { ExerciseMeasurement } from "@/types/common";
import type { PlannedSet, TrainingWeek } from "@/types/training-plan";
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

  // Kept in a ref so the unmount flush below always reads the latest values
  // without depending on them — depending on them would re-run it, and its
  // cleanup, on every edit instead of only on unmount.
  const pendingRef = useRef({ weekId: week.id, payload, savedSnapshot });
  useEffect(() => {
    pendingRef.current = { weekId: week.id, payload, savedSnapshot };
  });

  useEffect(() => {
    // Switching to another week (mounted with a fresh `key`) or leaving the
    // plan page unmounts this component, which cancels the debounce above
    // before it fires — silently dropping whatever was the last edit. Flush
    // it straight to the mutation instead of waiting for the debounce.
    return () => {
      const { weekId, payload: latestPayload, savedSnapshot: latestSavedSnapshot } =
        pendingRef.current;
      if (JSON.stringify(latestPayload) !== latestSavedSnapshot) {
        saveDays.mutate({ weekId, days: latestPayload });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A hard refresh or tab close skips React's unmount cleanup entirely, so
  // the flush above can't help there — warn instead of losing the edit.
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

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
            onSetSetsCount={(key, sets) =>
              setDraft((current) =>
                setSetsCount(current, day.day_of_week, key, sets),
              )
            }
            onTogglePlannedSets={(key) =>
              setDraft((current) =>
                togglePlannedSets(current, day.day_of_week, key),
              )
            }
            onUpdatePlannedSet={(
              key,
              setNumber,
              changes: Partial<Omit<PlannedSet, "set_number">>,
            ) =>
              setDraft((current) =>
                updatePlannedSet(current, day.day_of_week, key, setNumber, changes),
              )
            }
            onApplyToAllSets={(key, setNumber) =>
              setDraft((current) =>
                applyToAllSets(current, day.day_of_week, key, setNumber),
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
