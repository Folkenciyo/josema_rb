/** A set that was actually performed. Sets the client skipped are simply absent. */
export interface LoggedSet {
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
}

export interface WorkoutExercise {
  /** Id of the exercise within the plan — what a recorded set points back to. */
  id: string;
  name_es: string;
  image_path: string | null;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  tempo: string | null;
  notes: string | null;
  superset_group: number | null;
  last_performed_on: string | null;
  last_sets: LoggedSet[];
}

export interface WorkoutDay {
  id: string;
  week_number: number;
  day_of_week_es: string;
  exercise_count: number;
  last_performed_on: string | null;
}

export interface WorkoutDayDetail {
  id: string;
  week_number: number;
  day_of_week_es: string;
  plan_title: string;
  exercises: WorkoutExercise[];
}

export interface LoggedSetInput {
  training_day_exercise_id: string | null;
  exercise_name: string;
  order_index: number;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
}

/**
 * A finished session, exactly as it travels to the server. It is also what gets
 * parked in the phone when there is no coverage, so it has to be self-contained.
 */
export interface WorkoutSessionInput {
  device_session_id: string;
  training_day_id: string;
  performed_on: string;
  notes: string | null;
  sets: LoggedSetInput[];
}

export interface WorkoutSet extends LoggedSet {
  exercise_name: string;
  order_index: number;
  target_reps: string | null;
}

export interface WorkoutSession {
  id: string;
  performed_on: string;
  day_of_week_es: string;
  plan_title: string | null;
  notes: string | null;
  sets: WorkoutSet[];
}

export interface WorkoutSessionSummary {
  id: string;
  performed_on: string;
  day_of_week_es: string;
  plan_title: string | null;
  exercise_count: number;
  set_count: number;
  total_volume_kg: number;
}

export interface ExercisePoint {
  performed_on: string;
  top_weight_kg: number | null;
  top_reps: number | null;
  total_volume_kg: number;
}

export interface ExerciseHistory {
  exercise_name: string;
  points: ExercisePoint[];
}
