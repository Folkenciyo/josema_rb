import {
  DAYS_OF_WEEK,
  type DayOfWeek,
  type ExerciseMeasurement,
} from "@/types/common";
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
  measurement: ExerciseMeasurement;
  /** Set when measurement is "reps"; null when it's "time". */
  reps: string | null;
  /** Set when measurement is "time"; null when it's "reps". */
  duration_seconds: number | null;
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
  /** What the trainer asks of the day as a whole, beyond its exercises. */
  notes: string | null;
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
    measurement: exercise.measurement,
    reps: exercise.reps,
    duration_seconds: exercise.duration_seconds,
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
    measurement: "reps",
    reps: DEFAULT_REPS,
    duration_seconds: null,
    rest_seconds: null,
    tempo: null,
    superset_group: null,
    notes: null,
    superset_note: null,
  };
}

/**
 * Switches an exercise between reps and time, filling in a sane default for
 * whichever field the new mode uses so the row is never left with neither.
 */
export function setMeasurement(
  draft: WeekDraft,
  day: DayOfWeek,
  key: string,
  measurement: ExerciseMeasurement,
): WeekDraft {
  return mapDay(draft, day, (exercises) =>
    exercises.map((exercise) =>
      exercise.key === key
        ? {
            ...exercise,
            measurement,
            reps: measurement === "reps" ? (exercise.reps ?? DEFAULT_REPS) : null,
            duration_seconds:
              measurement === "time" ? (exercise.duration_seconds ?? 30) : null,
          }
        : exercise,
    ),
  );
}

/** Every weekday is always present in the draft; an empty one means a rest day. */
export function buildWeekDraft(week: TrainingWeek): WeekDraft {
  return DAYS_OF_WEEK.map((day) => {
    const existing = week.days.find((item) => item.day_of_week === day);

    return {
      day_of_week: day,
      notes: existing?.notes ?? null,
      exercises: (existing?.exercises ?? [])
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map(toExerciseDraft),
    };
  });
}

/**
 * Empty days are dropped: the backend stores only the days that say something.
 * A rest day with a note — "descansa y estira" — is one of them, so it is the
 * note and not just the exercises that keeps a day alive.
 */
export function weekDraftToPayload(draft: WeekDraft): TrainingDayInput[] {
  return draft
    .filter((day) => day.exercises.length > 0 || day.notes !== null)
    .map((day, dayIndex) => ({
      day_of_week: day.day_of_week,
      order_index: dayIndex,
      notes: day.notes,
      exercises: day.exercises.map((exercise, exerciseIndex) => ({
        exercise_id: exercise.exercise_id,
        order_index: exerciseIndex,
        sets: exercise.sets,
        measurement: exercise.measurement,
        reps: exercise.reps,
        duration_seconds: exercise.duration_seconds,
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

/** The note of the day. Blank is no note at all, not an empty one. */
export function setDayNotes(
  draft: WeekDraft,
  day: DayOfWeek,
  notes: string,
): WeekDraft {
  return draft.map((item) =>
    item.day_of_week === day ? { ...item, notes: notes.trim() || null } : item,
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

/**
 * Swaps two days' content (exercises and notes) while each keeps its own
 * weekday label and position — this is how "make Thursday's session run on
 * Wednesday" actually works, since a slot's day_of_week is fixed.
 */
export function swapDays(
  draft: WeekDraft,
  dayA: DayOfWeek,
  dayB: DayOfWeek,
): WeekDraft {
  const indexA = draft.findIndex((item) => item.day_of_week === dayA);
  const indexB = draft.findIndex((item) => item.day_of_week === dayB);
  if (indexA === -1 || indexB === -1 || indexA === indexB) {
    return draft;
  }

  return draft.map((item, index) => {
    if (index === indexA) {
      return { ...item, notes: draft[indexB].notes, exercises: draft[indexB].exercises };
    }
    if (index === indexB) {
      return { ...item, notes: draft[indexA].notes, exercises: draft[indexA].exercises };
    }
    return item;
  });
}

export function countExercises(draft: WeekDraft): number {
  return draft.reduce((total, day) => total + day.exercises.length, 0);
}
