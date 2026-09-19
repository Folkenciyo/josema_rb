import type {
  DayOfWeek,
  ExerciseMeasurement,
  PlanStatus,
  SetModifier,
} from "./common";

export interface PlannedSet {
  set_number: number;
  reps: string | null;
  duration_seconds: number | null;
  modifier: SetModifier;
  /** Only set when modifier is "rir". */
  rir_value: number | null;
}

export interface TrainingPlan {
  id: string;
  client_id: string;
  title: string;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  status: PlanStatus;
  /** Whether the weeks start over once the last one is done. */
  repeats: boolean;
}

export interface TrainingDayExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  measurement: ExerciseMeasurement;
  reps: string | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  tempo: string | null;
  superset_group: number | null;
  notes: string | null;
  /** The note about the whole block — only the exercise that opens it has one. */
  superset_note: string | null;
  /** Empty unless individual sets were customized; `sets` × `reps` otherwise. */
  planned_sets: PlannedSet[];
}

export interface TrainingDay {
  id: string;
  day_of_week: DayOfWeek;
  order_index: number;
  /** What the trainer asks of the day as a whole, beyond its exercises. */
  notes: string | null;
  exercises: TrainingDayExercise[];
}

export interface TrainingWeek {
  id: string;
  week_number: number;
  notes: string | null;
  days: TrainingDay[];
}

export interface TrainingPlanDetail extends TrainingPlan {
  weeks: TrainingWeek[];
}

export interface TrainingPlanInput {
  title: string;
  notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: PlanStatus;
  repeats?: boolean;
}

/** Payload shape of `PUT /training-weeks/{id}/days`: replaces the whole week tree. */
export interface TrainingDayExerciseInput {
  exercise_id: string;
  order_index: number;
  sets: number;
  measurement: ExerciseMeasurement;
  reps: string | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  tempo: string | null;
  superset_group: number | null;
  notes: string | null;
  /** Kept by the backend only on the exercise that opens a superset. */
  superset_note: string | null;
  /** When provided, must have exactly `sets` entries and becomes the target. */
  planned_sets?: PlannedSetInput[] | null;
}

export interface PlannedSetInput {
  set_number: number;
  reps?: string | null;
  duration_seconds?: number | null;
  modifier: SetModifier;
  rir_value?: number | null;
}

export interface TrainingDayInput {
  day_of_week: DayOfWeek;
  order_index: number;
  notes: string | null;
  exercises: TrainingDayExerciseInput[];
}
