import { DAYS_OF_WEEK, type DayOfWeek } from "@/types/common";
import type {
  TrainingDayInput,
  TrainingWeek,
  TrainingDayExercise,
} from "@/types/training-plan";

/** Local-only id: keeps React keys and drag-and-drop stable before the row is saved. */
export interface ExerciseDraft {
  key: string;
  exercise_id: string;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  tempo: string | null;
  superset_group: number | null;
  notes: string | null;
}

export interface DayDraft {
  day_of_week: DayOfWeek;
  exercises: ExerciseDraft[];
}

export type WeekDraft = DayDraft[];

export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = "10";

let keyCounter = 0;

function nextKey(): string {
  keyCounter += 1;
  return `draft-${keyCounter}`;
}

function toExerciseDraft(exercise: TrainingDayExercise): ExerciseDraft {
  return {
    key: exercise.id,
    exercise_id: exercise.exercise_id,
    sets: exercise.sets,
    reps: exercise.reps,
    rest_seconds: exercise.rest_seconds,
    tempo: exercise.tempo,
    superset_group: exercise.superset_group,
    notes: exercise.notes,
  };
}

export function createExerciseDraft(exerciseId: string): ExerciseDraft {
  return {
    key: nextKey(),
    exercise_id: exerciseId,
    sets: DEFAULT_SETS,
    reps: DEFAULT_REPS,
    rest_seconds: null,
    tempo: null,
    superset_group: null,
    notes: null,
  };
}

/** Every weekday is always present in the draft; an empty one means a rest day. */
export function buildWeekDraft(week: TrainingWeek): WeekDraft {
  return DAYS_OF_WEEK.map((day) => {
    const existing = week.days.find((item) => item.day_of_week === day);

    return {
      day_of_week: day,
      exercises: (existing?.exercises ?? [])
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map(toExerciseDraft),
    };
  });
}

/** Days without exercises are dropped: the backend stores only training days. */
export function weekDraftToPayload(draft: WeekDraft): TrainingDayInput[] {
  return draft
    .filter((day) => day.exercises.length > 0)
    .map((day, dayIndex) => ({
      day_of_week: day.day_of_week,
      order_index: dayIndex,
      exercises: day.exercises.map((exercise, exerciseIndex) => ({
        exercise_id: exercise.exercise_id,
        order_index: exerciseIndex,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.rest_seconds,
        tempo: exercise.tempo,
        superset_group: exercise.superset_group,
        notes: exercise.notes,
      })),
    }));
}

function mapDay(
  draft: WeekDraft,
  day: DayOfWeek,
  transform: (exercises: ExerciseDraft[]) => ExerciseDraft[],
): WeekDraft {
  return draft.map((item) =>
    item.day_of_week === day
      ? { ...item, exercises: transform(item.exercises) }
      : item,
  );
}

export function addExercises(
  draft: WeekDraft,
  day: DayOfWeek,
  exerciseIds: string[],
): WeekDraft {
  return mapDay(draft, day, (exercises) => [
    ...exercises,
    ...exerciseIds.map(createExerciseDraft),
  ]);
}

export function removeExercise(
  draft: WeekDraft,
  day: DayOfWeek,
  key: string,
): WeekDraft {
  return mapDay(draft, day, (exercises) =>
    exercises.filter((exercise) => exercise.key !== key),
  );
}

export function updateExercise(
  draft: WeekDraft,
  day: DayOfWeek,
  key: string,
  changes: Partial<Omit<ExerciseDraft, "key">>,
): WeekDraft {
  return mapDay(draft, day, (exercises) =>
    exercises.map((exercise) =>
      exercise.key === key ? { ...exercise, ...changes } : exercise,
    ),
  );
}

export function moveExercise(
  draft: WeekDraft,
  day: DayOfWeek,
  fromIndex: number,
  toIndex: number,
): WeekDraft {
  return mapDay(draft, day, (exercises) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= exercises.length ||
      toIndex >= exercises.length
    ) {
      return exercises;
    }

    const reordered = exercises.slice();
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    return reordered;
  });
}

export function countExercises(draft: WeekDraft): number {
  return draft.reduce((total, day) => total + day.exercises.length, 0);
}
