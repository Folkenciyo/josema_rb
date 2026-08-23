export interface Exercise {
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
  /** Set once the trainer edits it: from then on the seed leaves it alone. */
  created_by_trainer_id: string | null;
  /** Where it came from: "trainer" is one written here, the rest are imported. */
  source: string;
  /** Out of the search and the picker, but still fine in the routines using it. */
  is_hidden: boolean;
}

export interface ExerciseFilters {
  categories: string[];
  levels: string[];
  forces: string[];
  mechanics: string[];
  equipment: string[];
  muscles: string[];
}

export interface ExerciseQuery {
  search?: string;
  muscle?: string;
  equipment?: string;
  category?: string;
  level?: string;
  /**
   * "visible" (the default) is the catalogue, "hidden" the shelf of what the
   * trainer put away, and "all" both — needed to name an exercise a routine
   * already uses, hidden or not.
   */
  visibility?: "visible" | "hidden" | "all";
}

export interface ExerciseInput {
  name_es: string;
  instructions_es: string[];
  category_es: string | null;
  level_es: string | null;
  force_es: string | null;
  mechanic_es: string | null;
  equipment_es: string | null;
  primary_muscles_es: string[];
  secondary_muscles_es: string[];
  images: File[];
}

export const MAX_EXERCISE_IMAGES = 2;
export const MAX_EXERCISE_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];

/**
 * Only an exercise written here can be deleted: an imported one would come back
 * on the next seed run, so it is hidden instead.
 */
export function canDeleteExercise(exercise: Exercise): boolean {
  return exercise.source === "trainer";
}

/** True once the trainer has edited it — the catalogue no longer overwrites it. */
export function isTakenOver(exercise: Exercise): boolean {
  return exercise.source !== "trainer" && exercise.created_by_trainer_id !== null;
}
