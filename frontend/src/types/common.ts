export type PlanStatus = "draft" | "active" | "archived";

export type ExerciseMeasurement = "reps" | "time";

export type SetModifier = "normal" | "to_failure" | "rir";

export const SET_MODIFIER_LABELS: Record<SetModifier, string> = {
  normal: "Normal",
  to_failure: "Al fallo",
  rir: "RIR",
};

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
