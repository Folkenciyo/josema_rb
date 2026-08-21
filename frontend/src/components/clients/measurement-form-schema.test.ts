import {
  emptyMeasurementForm,
  formValuesToMeasurementInput,
  measurementFormSchema,
  measurementToFormValues,
  todayIso,
} from "./measurement-form-schema";
import type { Measurement } from "@/types/measurement";

const measurement: Measurement = {
  id: "m1",
  client_id: "c1",
  measured_on: "2026-08-01",
  weight_kg: 81.5,
  notes: "Tras el desayuno",
  client_notes: null,
  bmi: 25.2,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
};

describe("measurementFormSchema", () => {
  it("requires a date", () => {
    const result = measurementFormSchema.safeParse({
      measured_on: "",
      weight_kg: "81",
      notes: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a comma as decimal separator", () => {
    const result = measurementFormSchema.safeParse({
      measured_on: "2026-08-01",
      weight_kg: "81,5",
      notes: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a weight out of range", () => {
    for (const weight_kg of ["0", "-5", "501", "abc"]) {
      const result = measurementFormSchema.safeParse({
        measured_on: "2026-08-01",
        weight_kg,
        notes: "",
      });

      expect(result.success).toBe(false);
    }
  });
});

describe("todayIso", () => {
  it("uses the local day, not UTC", () => {
    // 00:30 local on the 5th is still the 4th in UTC.
    expect(todayIso(new Date(2026, 7, 5, 0, 30))).toBe("2026-08-05");
  });
});

describe("emptyMeasurementForm", () => {
  it("defaults the date to today", () => {
    expect(emptyMeasurementForm(new Date(2026, 7, 5))).toEqual({
      measured_on: "2026-08-05",
      weight_kg: "",
      notes: "",
    });
  });
});

describe("measurementToFormValues", () => {
  it("maps an existing weigh-in onto the form", () => {
    expect(measurementToFormValues(measurement)).toEqual({
      measured_on: "2026-08-01",
      weight_kg: "81.5",
      notes: "Tras el desayuno",
    });
  });
});

describe("formValuesToMeasurementInput", () => {
  it("parses the weight and clears blank notes", () => {
    expect(
      formValuesToMeasurementInput({
        measured_on: "2026-08-01",
        weight_kg: "81,5",
        notes: "   ",
      }),
    ).toEqual({ measured_on: "2026-08-01", weight_kg: 81.5, notes: null });
  });
});
