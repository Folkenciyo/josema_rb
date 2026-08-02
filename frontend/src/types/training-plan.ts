import type { DayOfWeek, PlanStatus } from "./common";

export interface TrainingPlan {
  id: string;
  client_id: string;
  title: string;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  status: PlanStatus;
}

export interface TrainingDayExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  tempo: string | null;
  superset_group: number | null;
  notes: string | null;
}

export interface TrainingDay {
  id: string;
  day_of_week: DayOfWeek;
  order_index: number;
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
}

/** Payload shape of `PUT /training-weeks/{id}/days`: replaces the whole week tree. */
export interface TrainingDayExerciseInput {
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  tempo: string | null;
  superset_group: number | null;
  notes: string | null;
}

export interface TrainingDayInput {
  day_of_week: DayOfWeek;
  order_index: number;
  exercises: TrainingDayExerciseInput[];
}
