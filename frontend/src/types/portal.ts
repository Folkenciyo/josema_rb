import type { MacroTotals } from "./diet";
import type { PhotoPose } from "./photo";
import type { Quote } from "./quote";

export interface PortalToken {
  client_id: string;
  portal_token: string | null;
  portal_token_issued_at: string | null;
}

/** Ready-to-send wording for the link, composed by the backend. */
export interface PortalInvite {
  url: string;
  subject: string;
  body: string;
  whatsapp_text: string;
}

/** What the client sees through their own link. Carries no client id by design. */
export interface PortalHome {
  full_name: string;
  goals: string | null;
  latest_weight_kg: number | null;
  latest_weighed_on: string | null;
  has_training_plan: boolean;
  has_diet_plan: boolean;
  weigh_in_count: number;
  /** Null means the client never agreed to their progress photos being kept. */
  photo_consent_at: string | null;
  photo_count: number;
  /** Sessions logged: the portal only offers the charts once there are any. */
  workout_count: number;
  /** Today's message: the one pinned to this client, or one from the rotation. */
  quote: Quote | null;
}

/** A progress photo as the client gets it: no client id, no path on disk. */
export interface PortalPhoto {
  id: string;
  taken_on: string;
  pose: PhotoPose;
}

/**
 * The plans arrive already flattened by the backend — the very same document the
 * PDF is rendered from — so the portal shows exercise names and pictures with no
 * lookup of its own. The catalogue id rides along only so that tapping a row can
 * ask for its sheet, through the same token.
 */
export interface PortalExercise {
  /** The catalogue id, only good for opening the sheet through the same token. */
  exercise_id: string;
  name_es: string;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  tempo: string | null;
  notes: string | null;
  image_path: string | null;
  /** "A1"/"A2" when it is chained to the next one, with no rest in between. */
  superset_label: string | null;
  /** The note about the block, carried by the exercise that opens it. */
  superset_note: string | null;
}

/** An exercise sheet as the client reads it: how it is done, and nothing else. */
export interface PortalExerciseDetail {
  id: string;
  name_es: string;
  category_es: string | null;
  level_es: string | null;
  force_es: string | null;
  mechanic_es: string | null;
  equipment_es: string | null;
  primary_muscles_es: string[];
  secondary_muscles_es: string[];
  instructions_es: string[];
  images: string[];
}

export interface PortalTrainingDay {
  day_of_week_es: string;
  exercises: PortalExercise[];
}

export interface PortalTrainingWeek {
  week_number: number;
  notes: string | null;
  days: PortalTrainingDay[];
}

export interface PortalTrainingPlan {
  client_name: string;
  plan_title: string;
  plan_notes: string | null;
  start_date: string | null;
  end_date: string | null;
  weeks: PortalTrainingWeek[];
}

export interface PortalMealItem {
  food_name: string;
  quantity_label: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

export interface PortalMeal {
  name: string;
  time_of_day: string | null;
  items: PortalMealItem[];
  totals: MacroTotals;
}

export interface PortalDietDay {
  day_of_week_es: string;
  menu_name: string | null;
  meals: PortalMeal[];
  totals: MacroTotals | null;
}

export interface PortalDietWeek {
  week_number: number;
  notes: string | null;
  days: PortalDietDay[];
}

export interface PortalDietPlan {
  client_name: string;
  plan_title: string;
  plan_notes: string | null;
  start_date: string | null;
  end_date: string | null;
  daily_calories_target: number | null;
  daily_protein_g: number | null;
  daily_carbs_g: number | null;
  daily_fat_g: number | null;
  weeks: PortalDietWeek[];
}

export function portalPath(token: string): string {
  return `/p/${token}`;
}
