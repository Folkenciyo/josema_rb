import { z } from "zod";

import type { Measurement, MeasurementInput } from "@/types/measurement";

const MAX_WEIGHT_KG = 500;

/** A trainer typing on a phone writes "81,5" as often as "81.5". */
function parseWeight(value: string): number {
  return Number(value.replace(",", "."));
}

export const measurementFormSchema = z.object({
  measured_on: z.string().min(1, "La fecha es obligatoria"),
  weight_kg: z
    .string()
    .refine(
      (value) => parseWeight(value) > 0 && parseWeight(value) <= MAX_WEIGHT_KG,
      "Introduce un peso válido en kg",
    ),
  notes: z.string(),
});

export type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

/** Local date as `YYYY-MM-DD`; `toISOString()` would shift the day in Spain. */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function emptyMeasurementForm(now?: Date): MeasurementFormValues {
  return { measured_on: todayIso(now), weight_kg: "", notes: "" };
}

export function measurementToFormValues(
  measurement: Measurement,
): MeasurementFormValues {
  return {
    measured_on: measurement.measured_on.slice(0, 10),
    weight_kg: String(measurement.weight_kg),
    notes: measurement.notes ?? "",
  };
}

export function formValuesToMeasurementInput(
  values: MeasurementFormValues,
): MeasurementInput {
  return {
    measured_on: values.measured_on,
    weight_kg: parseWeight(values.weight_kg),
    notes: values.notes.trim() === "" ? null : values.notes.trim(),
  };
}
