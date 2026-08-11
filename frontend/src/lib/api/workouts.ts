import { api } from "./http";
import type {
  ExerciseHistory,
  TrainedExercise,
  WorkoutDay,
  WorkoutDayDetail,
  WorkoutSession,
  WorkoutSessionInput,
  WorkoutSessionSummary,
} from "@/types/workout";

/** Calls the client's own device makes, resolved by the token alone. */
export function getWorkoutDays(token: string): Promise<WorkoutDay[]> {
  return api.get<WorkoutDay[]>(`/portal/${token}/workout/days`);
}

export function getWorkoutDay(
  token: string,
  dayId: string,
): Promise<WorkoutDayDetail> {
  return api.get<WorkoutDayDetail>(`/portal/${token}/workout/days/${dayId}`);
}

export function getPortalWorkouts(
  token: string,
): Promise<WorkoutSessionSummary[]> {
  return api.get<WorkoutSessionSummary[]>(`/portal/${token}/workouts`);
}

/** Sending the same session twice is safe: the server answers with the stored one. */
export function recordWorkout(
  token: string,
  payload: WorkoutSessionInput,
): Promise<WorkoutSession> {
  return api.post<WorkoutSession>(`/portal/${token}/workouts`, payload);
}

/** What the trainer reads from the client's file. */
export function getClientWorkouts(
  clientId: string,
): Promise<WorkoutSessionSummary[]> {
  return api.get<WorkoutSessionSummary[]>(`/clients/${clientId}/workouts`);
}

export function getClientWorkout(
  clientId: string,
  sessionId: string,
): Promise<WorkoutSession> {
  return api.get<WorkoutSession>(`/clients/${clientId}/workouts/${sessionId}`);
}

export function getTrainedExercises(
  clientId: string,
): Promise<TrainedExercise[]> {
  return api.get<TrainedExercise[]>(`/clients/${clientId}/trained-exercises`);
}

export function getExerciseHistory(
  clientId: string,
  exerciseId: string,
): Promise<ExerciseHistory> {
  return api.get<ExerciseHistory>(
    `/clients/${clientId}/exercises/${exerciseId}/history`,
  );
}
