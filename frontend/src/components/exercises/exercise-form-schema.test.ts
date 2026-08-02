import {
  exerciseFormSchema,
  exerciseToFormValues,
  EMPTY_EXERCISE_FORM,
  splitInstructions,
  validateImages,
} from "./exercise-form-schema";
import type { Exercise } from "@/types/exercise";

function makeFile(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("splitInstructions", () => {
  it("turns one line per step into a list, ignoring blanks", () => {
    expect(splitInstructions("Paso 1\n\n  Paso 2  \n")).toEqual([
      "Paso 1",
      "Paso 2",
    ]);
  });

  it("returns an empty list for whitespace only", () => {
    expect(splitInstructions("   \n  ")).toEqual([]);
  });
});

describe("exerciseFormSchema", () => {
  it("requires a name and at least one instruction step", () => {
    expect(exerciseFormSchema.safeParse(EMPTY_EXERCISE_FORM).success).toBe(false);
    expect(
      exerciseFormSchema.safeParse({
        ...EMPTY_EXERCISE_FORM,
        name_es: "Sentadilla búlgara",
        instructions_text: "Baja despacio",
      }).success,
    ).toBe(true);
  });
});

describe("validateImages", () => {
  it("accepts up to two valid images", () => {
    expect(
      validateImages([
        makeFile("a.jpg", "image/jpeg", 1000),
        makeFile("b.png", "image/png", 1000),
      ]),
    ).toBeNull();
  });

  it("rejects a third image", () => {
    const files = [
      makeFile("a.jpg", "image/jpeg", 10),
      makeFile("b.jpg", "image/jpeg", 10),
      makeFile("c.jpg", "image/jpeg", 10),
    ];

    expect(validateImages(files)).toContain("máximo");
  });

  it("rejects unsupported types", () => {
    expect(validateImages([makeFile("a.gif", "image/gif", 10)])).toContain("JPG");
  });

  it("rejects files over 5 MB", () => {
    expect(
      validateImages([makeFile("a.jpg", "image/jpeg", 6 * 1024 * 1024)]),
    ).toContain("MB");
  });
});

describe("exerciseToFormValues", () => {
  it("joins instructions with newlines and nulls become empty strings", () => {
    const exercise = {
      id: "custom-1",
      name_es: "Remo",
      category_es: null,
      level_es: "Principiante",
      force_es: null,
      mechanic_es: null,
      equipment_es: null,
      primary_muscles_es: ["Espalda"],
      secondary_muscles_es: [],
      instructions_es: ["Paso 1", "Paso 2"],
      images: [],
      created_by_trainer_id: "t1",
    } satisfies Exercise;

    expect(exerciseToFormValues(exercise)).toMatchObject({
      instructions_text: "Paso 1\nPaso 2",
      category_es: "",
      level_es: "Principiante",
    });
  });
});
