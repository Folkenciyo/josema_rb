export type PlanStatus = "draft" | "active" | "archived";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
};

export interface PlanSummary {
  id: string;
  title: string;
  status: PlanStatus;
  start_date: string | null;
  end_date: string | null;
}
