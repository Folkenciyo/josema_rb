import type { DayOfWeek, PlanStatus } from "./common";
import type { MacroTotals, MenuSummary } from "./diet";

export interface DietPlan {
  id: string;
  client_id: string;
  title: string;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  status: PlanStatus;
  daily_calories_target: number | null;
  daily_protein_g: number | null;
  daily_carbs_g: number | null;
  daily_fat_g: number | null;
}

export interface DietDay {
  id: string;
  day_of_week: DayOfWeek;
  order_index: number;
  menu: MenuSummary | null;
  totals: MacroTotals | null;
}

export interface DietWeek {
  id: string;
  week_number: number;
  notes: string | null;
  days: DietDay[];
}

export interface DietPlanDetail extends DietPlan {
  weeks: DietWeek[];
}

export interface DietPlanInput {
  title: string;
  notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: PlanStatus;
  daily_calories_target?: number | null;
  daily_protein_g?: number | null;
  daily_carbs_g?: number | null;
  daily_fat_g?: number | null;
}

export interface DietDayInput {
  day_of_week: DayOfWeek;
  order_index: number;
  menu_id: string | null;
}

export interface AssignMenuInput {
  menu_id: string;
  /** `null` applies the menu to all seven days. */
  days_of_week: DayOfWeek[] | null;
}
