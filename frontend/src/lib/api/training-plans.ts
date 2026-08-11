import { api } from "./http";
import type {
  TrainingDayInput,
  TrainingPlan,
  TrainingPlanDetail,
  TrainingPlanInput,
  TrainingWeek,
} from "@/types/training-plan";

export function listTrainingPlans(clientId: string): Promise<TrainingPlan[]> {
  return api.get<TrainingPlan[]>(`/clients/${clientId}/training-plans`);
}

export function createTrainingPlan(
  clientId: string,
  input: TrainingPlanInput,
): Promise<TrainingPlan> {
  return api.post<TrainingPlan>(`/clients/${clientId}/training-plans`, input);
}

export function getTrainingPlan(planId: string): Promise<TrainingPlanDetail> {
  return api.get<TrainingPlanDetail>(`/training-plans/${planId}`);
}

export function updateTrainingPlan(
  planId: string,
  input: Partial<TrainingPlanInput>,
): Promise<TrainingPlan> {
  return api.patch<TrainingPlan>(`/training-plans/${planId}`, input);
}

export function deleteTrainingPlan(planId: string): Promise<void> {
  return api.delete(`/training-plans/${planId}`);
}

export function addTrainingWeek(
  planId: string,
  weekNumber: number,
  notes: string | null = null,
): Promise<TrainingWeek> {
  return api.post<TrainingWeek>(`/training-plans/${planId}/weeks`, {
    week_number: weekNumber,
    notes,
  });
}

/** Transactional replacement of every day (and exercise) in the week. */
export function setTrainingWeekDays(
  weekId: string,
  days: TrainingDayInput[],
): Promise<TrainingWeek> {
  return api.put<TrainingWeek>(`/training-weeks/${weekId}/days`, { days });
}

export function duplicateTrainingWeek(
  weekId: string,
  weekNumber: number,
): Promise<TrainingWeek> {
  return api.post<TrainingWeek>(`/training-weeks/${weekId}/duplicate`, {
    week_number: weekNumber,
  });
}

/** Reusable routines: a plan with no client, owned by the trainer. */
export function listTrainingTemplates(): Promise<TrainingPlan[]> {
  return api.get<TrainingPlan[]>("/training-templates");
}

export function createTrainingTemplate(title: string): Promise<TrainingPlan> {
  return api.post<TrainingPlan>("/training-templates", { title });
}

/** Copies a template — or another client's routine — onto this client. */
export function copyTrainingPlanToClient(
  clientId: string,
  sourcePlanId: string,
  title?: string,
): Promise<TrainingPlan> {
  return api.post<TrainingPlan>(
    `/clients/${clientId}/training-plans/from/${sourcePlanId}`,
    { title: title ?? null },
  );
}

export function saveTrainingPlanAsTemplate(
  planId: string,
  title?: string,
): Promise<TrainingPlan> {
  return api.post<TrainingPlan>(`/training-plans/${planId}/save-as-template`, {
    title: title ?? null,
  });
}
