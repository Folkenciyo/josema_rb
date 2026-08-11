import type {
  LoggedSet,
  WorkoutDayDetail,
  WorkoutExercise,
  WorkoutSessionInput,
} from "@/types/workout";

/**
 * The session being trained, held in memory (and parked in the phone) until it
 * is sent. Every function here returns a new draft: nothing is mutated, so the
 * screen can always render from the value it was given.
 */
export interface DraftSet {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  /** Only sets ticked off are sent — an untouched row means the set was skipped. */
  done: boolean;
}

export interface DraftExercise {
  planExerciseId: string;
  name: string;
  imagePath: string | null;
  targetSets: number;
  targetReps: string;
  restSeconds: number | null;
  notes: string | null;
  lastPerformedOn: string | null;
  lastSets: LoggedSet[];
  sets: DraftSet[];
}

export interface SessionDraft {
  deviceSessionId: string;
  dayId: string;
  dayLabel: string;
  planTitle: string;
  startedAt: string;
  notes: string;
  exercises: DraftExercise[];
}

/** A plain "10" can be filled in; a range like "8-12" is the client's call. */
function repsFromTarget(target: string): number | null {
  const parsed = Number(target.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function blankSets(exercise: WorkoutExercise): DraftSet[] {
  const lastBySetNumber = new Map(
    exercise.last_sets.map((set) => [set.set_number, set]),
  );

  return Array.from({ length: Math.max(exercise.sets, 1) }, (_, index) => {
    const setNumber = index + 1;
    const last = lastBySetNumber.get(setNumber);

    return {
      setNumber,
      // Last time's weight is the honest starting point: the client confirms it
      // or types over it, instead of remembering it between machines.
      weightKg: last?.weight_kg ?? null,
      reps: last?.reps ?? repsFromTarget(exercise.reps),
      done: false,
    };
  });
}

export function createDraft(
  day: WorkoutDayDetail,
  deviceSessionId: string,
  startedAt: string,
): SessionDraft {
  return {
    deviceSessionId,
    dayId: day.id,
    dayLabel: day.day_of_week_es,
    planTitle: day.plan_title,
    startedAt,
    notes: "",
    exercises: day.exercises.map((exercise) => ({
      planExerciseId: exercise.id,
      name: exercise.name_es,
      imagePath: exercise.image_path,
      targetSets: exercise.sets,
      targetReps: exercise.reps,
      restSeconds: exercise.rest_seconds,
      notes: exercise.notes,
      lastPerformedOn: exercise.last_performed_on,
      lastSets: exercise.last_sets,
      sets: blankSets(exercise),
    })),
  };
}

function replaceExercise(
  draft: SessionDraft,
  index: number,
  exercise: DraftExercise,
): SessionDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((current, position) =>
      position === index ? exercise : current,
    ),
  };
}

export function updateSet(
  draft: SessionDraft,
  exerciseIndex: number,
  setNumber: number,
  patch: Partial<Pick<DraftSet, "weightKg" | "reps" | "done">>,
): SessionDraft {
  const exercise = draft.exercises[exerciseIndex];
  if (!exercise) {
    return draft;
  }

  return replaceExercise(draft, exerciseIndex, {
    ...exercise,
    sets: exercise.sets.map((set) =>
      set.setNumber === setNumber ? { ...set, ...patch } : set,
    ),
  });
}

/** An extra set beyond what the plan asked for: it happens, and it counts. */
export function addSet(
  draft: SessionDraft,
  exerciseIndex: number,
): SessionDraft {
  const exercise = draft.exercises[exerciseIndex];
  if (!exercise) {
    return draft;
  }

  const last = exercise.sets[exercise.sets.length - 1];
  return replaceExercise(draft, exerciseIndex, {
    ...exercise,
    sets: [
      ...exercise.sets,
      {
        setNumber: (last?.setNumber ?? 0) + 1,
        weightKg: last?.weightKg ?? null,
        reps: last?.reps ?? null,
        done: false,
      },
    ],
  });
}

export function removeSet(
  draft: SessionDraft,
  exerciseIndex: number,
  setNumber: number,
): SessionDraft {
  const exercise = draft.exercises[exerciseIndex];
  if (!exercise || exercise.sets.length <= 1) {
    return draft;
  }

  return replaceExercise(draft, exerciseIndex, {
    ...exercise,
    sets: exercise.sets.filter((set) => set.setNumber !== setNumber),
  });
}

export function setNotes(draft: SessionDraft, notes: string): SessionDraft {
  return { ...draft, notes };
}

export function completedSets(draft: SessionDraft): number {
  return draft.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.done).length,
    0,
  );
}

export function isEmpty(draft: SessionDraft): boolean {
  return completedSets(draft) === 0;
}

/** Total kilos moved: the one number that says whether the session was hard. */
export function totalVolume(draft: SessionDraft): number {
  return draft.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce(
        (sum, set) =>
          set.done && set.weightKg !== null && set.reps !== null
            ? sum + set.weightKg * set.reps
            : sum,
        0,
      ),
    0,
  );
}

export function toPayload(
  draft: SessionDraft,
  performedOn: string,
): WorkoutSessionInput {
  return {
    device_session_id: draft.deviceSessionId,
    training_day_id: draft.dayId,
    performed_on: performedOn,
    notes: draft.notes.trim() || null,
    sets: draft.exercises.flatMap((exercise, orderIndex) =>
      exercise.sets
        .filter((set) => set.done)
        .map((set) => ({
          training_day_exercise_id: exercise.planExerciseId,
          exercise_name: exercise.name,
          order_index: orderIndex,
          set_number: set.setNumber,
          weight_kg: set.weightKg,
          reps: set.reps,
        })),
    ),
  };
}
