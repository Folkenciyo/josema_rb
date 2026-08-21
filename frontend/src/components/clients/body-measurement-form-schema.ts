import { z } from "zod";

import {
  BODY_ZONE_KEYS,
  type BodyMeasurement,
  type BodyMeasurementInput,
  type BodyZoneKey,
} from "@/types/measurement";
import { todayIso } from "./measurement-form-schema";

const MAX_ZONE_CM = 300;

/** A trainer typing on a phone writes "86,5" as often as "86.5". */
function parseCentimetres(value: string): number {
  return Number(value.replace(",", "."));
}

function isBlank(value: string): boolean {
  return value.trim() === "";
}

/** Blank is the normal case: nobody puts the tape round all nine spots. */
const zoneField = z
  .string()
  .refine(
    (value) =>
      isBlank(value) ||
      (parseCentimetres(value) > 0 && parseCentimetres(value) <= MAX_ZONE_CM),
    "Introduce una medida válida en cm",
  );

const zoneFields = Object.fromEntries(
  BODY_ZONE_KEYS.map((key) => [key, zoneField]),
) as Record<BodyZoneKey, typeof zoneField>;

export const bodyMeasurementFormSchema = z
  .object({
    measured_on: z.string().min(1, "La fecha es obligatoria"),
    notes: z.string(),
    ...zoneFields,
  })
  // A date and nine blanks says nothing, and would still use up the one entry
  // that day allows.
  .refine((values) => BODY_ZONE_KEYS.some((key) => !isBlank(values[key])), {
    message: "Apunta al menos una medida",
    path: ["measured_on"],
  });

export type BodyMeasurementFormValues = z.infer<
  typeof bodyMeasurementFormSchema
>;

export function emptyBodyMeasurementForm(now?: Date): BodyMeasurementFormValues {
  return {
    measured_on: todayIso(now),
    notes: "",
    ...(Object.fromEntries(BODY_ZONE_KEYS.map((key) => [key, ""])) as Record<
      BodyZoneKey,
      string
    >),
  };
}

export function bodyMeasurementToFormValues(
  measurement: BodyMeasurement,
): BodyMeasurementFormValues {
  return {
    measured_on: measurement.measured_on.slice(0, 10),
    notes: measurement.notes ?? "",
    ...(Object.fromEntries(
      BODY_ZONE_KEYS.map((key) => [
        key,
        measurement[key] === null ? "" : String(measurement[key]),
      ]),
    ) as Record<BodyZoneKey, string>),
  };
}

export function formValuesToBodyMeasurementInput(
  values: BodyMeasurementFormValues,
): BodyMeasurementInput {
  return {
    measured_on: values.measured_on,
    notes: isBlank(values.notes) ? null : values.notes.trim(),
    // Every zone travels, blanks included: sending null is how the trainer
    // clears a reading they typed by mistake.
    ...(Object.fromEntries(
      BODY_ZONE_KEYS.map((key) => [
        key,
        isBlank(values[key]) ? null : parseCentimetres(values[key]),
      ]),
    ) as Record<BodyZoneKey, number | null>),
  };
}
