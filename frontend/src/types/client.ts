import type { PlanSummary } from "./common";

export type Sex = "male" | "female" | "other";

export interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  sex: string | null;
  height_cm: number | null;
  goals: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientDetail extends Client {
  training_plans: PlanSummary[];
  diet_plans: PlanSummary[];
  /** Only present on the detail endpoint: the listing carries no secrets. */
  portal_token: string | null;
  portal_token_issued_at: string | null;
}

export interface ClientInput {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  sex?: string | null;
  height_cm?: number | null;
  goals?: string | null;
  notes?: string | null;
}

export const SEX_LABELS: Record<Sex, string> = {
  male: "Hombre",
  female: "Mujer",
  other: "Otro",
};
