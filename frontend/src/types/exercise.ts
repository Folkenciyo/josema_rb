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
  /** `null` marks an exercise imported from free-exercise-db: read-only. */
  created_by_trainer_id: string | null;
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

export function isCustomExercise(exercise: Exercise): boolean {
  return exercise.created_by_trainer_id !== null;
}
