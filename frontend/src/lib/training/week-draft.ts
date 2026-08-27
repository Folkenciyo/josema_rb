import { DAYS_OF_WEEK, type DayOfWeek } from "@/types/common";
import type {
  TrainingDayInput,
  TrainingWeek,
  TrainingDayExercise,
} from "@/types/training-plan";
import { toSupersetBlocks, type SupersetBlock } from "./supersets";

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
  /**
   * The note about the whole block. Only the exercise that opens a superset
   * carries one; the backend drops it anywhere else, and so does this draft.
   */
  superset_note: string | null;
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
    superset_note: exercise.superset_note,
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
    superset_note: null,
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
        superset_note: exercise.superset_note,
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

function nextSupersetGroup(exercises: ExerciseDraft[]): number {
  return (
    exercises.reduce((max, exercise) => Math.max(max, exercise.superset_group ?? 0), 0) +
    1
  );
}

/** A block needs two exercises: whatever is left alone goes back to standing on its own. */
function dropLoneGroups(exercises: ExerciseDraft[]): ExerciseDraft[] {
  return toSupersetBlocks(exercises).flatMap((block) =>
    block.letter === null
      ? block.exercises.map((exercise) =>
          exercise.superset_group === null
            ? exercise
            : { ...exercise, superset_group: null },
        )
      : block.exercises,
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

/** A double exercise: the picked ones go in chained, each with its own numbers. */
export function addSupersetExercises(
  draft: WeekDraft,
  day: DayOfWeek,
  exerciseIds: string[],
): WeekDraft {
  return mapDay(draft, day, (exercises) => {
    const group = nextSupersetGroup(exercises);

    return [
      ...exercises,
      ...exerciseIds.map((exerciseId) => ({
        ...createExerciseDraft(exerciseId),
        superset_group: group,
      })),
    ];
  });
}

/** Breaks the block up: its exercises stay, now each on its own. */
export function ungroupSuperset(
  draft: WeekDraft,
  day: DayOfWeek,
  group: number,
): WeekDraft {
  return mapDay(draft, day, (exercises) =>
    exercises.map((exercise) =>
      exercise.superset_group === group
        ? // The note described the pair, so it goes with the pair.
          { ...exercise, superset_group: null, superset_note: null }
        : exercise,
    ),
  );
}

/**
 * The note of a whole block, written on the exercise that opens it. Anywhere
 * else it would be a second note for the same superset, which is why the rest
 * of the group is cleared as it is written.
 */
export function setSupersetNote(
  draft: WeekDraft,
  day: DayOfWeek,
  group: number,
  note: string | null,
): WeekDraft {
  return mapDay(draft, day, (exercises) => {
    const opener = exercises.findIndex(
      (exercise) => exercise.superset_group === group,
    );
    if (opener === -1) {
      return exercises;
    }

    return exercises.map((exercise, index) =>
      exercise.superset_group === group
        ? { ...exercise, superset_note: index === opener ? note : null }
        : exercise,
    );
  });
}

/** The block's note, wherever in the group it happens to sit. */
export function supersetNoteOf(exercises: ExerciseDraft[]): string | null {
  return (
    exercises.find((exercise) => exercise.superset_note)?.superset_note ?? null
  );
}

export function removeExercise(
  draft: WeekDraft,
  day: DayOfWeek,
  key: string,
): WeekDraft {
  return mapDay(draft, day, (exercises) =>
    dropLoneGroups(exercises.filter((exercise) => exercise.key !== key)),
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

/** The day as the editor draws it: lone exercises and superset blocks, in order. */
export function dayBlocks(day: DayDraft): SupersetBlock<ExerciseDraft>[] {
  return toSupersetBlocks(day.exercises);
}

/**
 * Reordering moves whole blocks: dragging one half of a superset out of its
 * block would leave the other half chained to nothing.
 */
export function moveBlock(
  draft: WeekDraft,
  day: DayOfWeek,
  fromIndex: number,
  toIndex: number,
): WeekDraft {
  return mapDay(draft, day, (exercises) => {
    const blocks = toSupersetBlocks(exercises);
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= blocks.length ||
      toIndex >= blocks.length
    ) {
      return exercises;
    }

    const reordered = blocks.slice();
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    return reordered.flatMap((block) => block.exercises);
  });
}

export function countExercises(draft: WeekDraft): number {
  return draft.reduce((total, day) => total + day.exercises.length, 0);
}
