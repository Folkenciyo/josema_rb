import { z } from "zod";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_EXERCISE_IMAGES,
  MAX_EXERCISE_IMAGE_BYTES,
  type Exercise,
} from "@/types/exercise";

export const exerciseFormSchema = z.object({
  name_es: z.string().trim().min(1, "El nombre es obligatorio"),
  instructions_text: z
    .string()
    .refine(
      (value) => splitInstructions(value).length > 0,
      "Añade al menos un paso",
    ),
  category_es: z.string(),
  level_es: z.string(),
  force_es: z.string(),
  mechanic_es: z.string(),
  equipment_es: z.string(),
});

export type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export const EMPTY_EXERCISE_FORM: ExerciseFormValues = {
  name_es: "",
  instructions_text: "",
  category_es: "",
  level_es: "",
  force_es: "",
  mechanic_es: "",
  equipment_es: "",
};

/** One instruction step per line — blank lines are ignored. */
export function splitInstructions(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

export function exerciseToFormValues(exercise: Exercise): ExerciseFormValues {
  return {
    name_es: exercise.name_es,
    instructions_text: exercise.instructions_es.join("\n"),
    category_es: exercise.category_es ?? "",
    level_es: exercise.level_es ?? "",
    force_es: exercise.force_es ?? "",
    mechanic_es: exercise.mechanic_es ?? "",
    equipment_es: exercise.equipment_es ?? "",
  };
}

export function validateImages(files: File[]): string | null {
  if (files.length > MAX_EXERCISE_IMAGES) {
    return `Como máximo ${MAX_EXERCISE_IMAGES} fotos.`;
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `"${file.name}" no es JPG ni PNG.`;
    }
    if (file.size > MAX_EXERCISE_IMAGE_BYTES) {
      return `"${file.name}" supera los ${MAX_EXERCISE_IMAGE_BYTES / (1024 * 1024)} MB.`;
    }
  }

  return null;
}
