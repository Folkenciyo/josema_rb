import { api } from "./http";
import type {
  Exercise,
  ExerciseFilters,
  ExerciseInput,
  ExerciseQuery,
} from "@/types/exercise";

function buildQueryString(query: ExerciseQuery): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value && value.trim() !== "") {
      params.set(key, value.trim());
    }
  }

  const queryString = params.toString();
  return queryString === "" ? "" : `?${queryString}`;
}

/** The backend takes the scalar fields as form values and JSON-encoded string lists. */
function buildFormData(input: Partial<ExerciseInput>): FormData {
  const formData = new FormData();

  const appendIfPresent = (key: string, value: string | null | undefined) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  };

  appendIfPresent("name_es", input.name_es);
  appendIfPresent("category_es", input.category_es);
  appendIfPresent("level_es", input.level_es);
  appendIfPresent("force_es", input.force_es);
  appendIfPresent("mechanic_es", input.mechanic_es);
  appendIfPresent("equipment_es", input.equipment_es);

  if (input.instructions_es) {
    formData.append("instructions_es", JSON.stringify(input.instructions_es));
  }
  if (input.primary_muscles_es) {
    formData.append(
      "primary_muscles_es",
      JSON.stringify(input.primary_muscles_es),
    );
  }
  if (input.secondary_muscles_es) {
    formData.append(
      "secondary_muscles_es",
      JSON.stringify(input.secondary_muscles_es),
    );
  }

  for (const image of input.images ?? []) {
    formData.append("images", image);
  }

  return formData;
}

export function listExercises(query: ExerciseQuery = {}): Promise<Exercise[]> {
  return api.get<Exercise[]>(`/exercises${buildQueryString(query)}`);
}

export function getExercise(exerciseId: string): Promise<Exercise> {
  return api.get<Exercise>(`/exercises/${exerciseId}`);
}

export function getExerciseFilters(): Promise<ExerciseFilters> {
  return api.get<ExerciseFilters>("/exercises/filters");
}

export function createExercise(input: ExerciseInput): Promise<Exercise> {
  return api.postForm<Exercise>("/exercises", buildFormData(input));
}

export function updateExercise(
  exerciseId: string,
  input: Partial<ExerciseInput>,
): Promise<Exercise> {
  return api.patchForm<Exercise>(
    `/exercises/${exerciseId}`,
    buildFormData(input),
  );
}

export function deleteExercise(exerciseId: string): Promise<void> {
  return api.delete(`/exercises/${exerciseId}`);
}
