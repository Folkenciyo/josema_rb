import { api } from "./http";
import type {
  AssignMenuInput,
  DietDayInput,
  DietPlan,
  DietPlanDetail,
  DietPlanInput,
  DietWeek,
} from "@/types/diet-plan";

export function listDietPlans(clientId: string): Promise<DietPlan[]> {
  return api.get<DietPlan[]>(`/clients/${clientId}/diet-plans`);
}

export function createDietPlan(
  clientId: string,
  input: DietPlanInput,
): Promise<DietPlan> {
  return api.post<DietPlan>(`/clients/${clientId}/diet-plans`, input);
}

export function getDietPlan(planId: string): Promise<DietPlanDetail> {
  return api.get<DietPlanDetail>(`/diet-plans/${planId}`);
}

export function updateDietPlan(
  planId: string,
  input: Partial<DietPlanInput>,
): Promise<DietPlan> {
  return api.patch<DietPlan>(`/diet-plans/${planId}`, input);
}

export function deleteDietPlan(planId: string): Promise<void> {
  return api.delete(`/diet-plans/${planId}`);
}

export function addDietWeek(
  planId: string,
  weekNumber: number,
  notes: string | null = null,
): Promise<DietWeek> {
  return api.post<DietWeek>(`/diet-plans/${planId}/weeks`, {
    week_number: weekNumber,
    notes,
  });
}

export function setDietWeekDays(
  weekId: string,
  days: DietDayInput[],
): Promise<DietWeek> {
  return api.put<DietWeek>(`/diet-weeks/${weekId}/days`, { days });
}

export function duplicateDietWeek(
  weekId: string,
  weekNumber: number,
): Promise<DietWeek> {
  return api.post<DietWeek>(`/diet-weeks/${weekId}/duplicate`, {
    week_number: weekNumber,
  });
}

/** Bulk assignment: same menu on every day, or only on the listed ones. */
export function assignMenuToWeek(
  weekId: string,
  input: AssignMenuInput,
): Promise<DietWeek> {
  return api.post<DietWeek>(`/diet-weeks/${weekId}/assign-menu`, input);
}
