import {
  bodyMeasurementFormSchema,
  emptyBodyMeasurementForm,
  formValuesToBodyMeasurementInput,
} from "./body-measurement-form-schema";

function form(overrides: Record<string, string> = {}) {
  return { ...emptyBodyMeasurementForm(new Date(2026, 8, 1)), ...overrides };
}

describe("bodyMeasurementFormSchema", () => {
  it("accepts an entry with a single zone filled in", () => {
    expect(bodyMeasurementFormSchema.safeParse(form({ waist_cm: "86,5" })).success).toBe(
      true,
    );
  });

  it("refuses an entry with every zone blank", () => {
    const result = bodyMeasurementFormSchema.safeParse(form());

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Apunta al menos una medida");
  });

  it("refuses a zone that reads like a weight", () => {
    const result = bodyMeasurementFormSchema.safeParse(form({ waist_cm: "860" }));

    expect(result.success).toBe(false);
  });
});

describe("formValuesToBodyMeasurementInput", () => {
  it("reads a comma as a decimal point", () => {
    const input = formValuesToBodyMeasurementInput(form({ waist_cm: "86,5" }));

    expect(input.waist_cm).toBe(86.5);
  });

  it("sends the untouched zones as null so a mistyped one can be cleared", () => {
    const input = formValuesToBodyMeasurementInput(form({ waist_cm: "86,5" }));

    expect(input.chest_cm).toBeNull();
    expect(input.calf_cm).toBeNull();
  });

  it("defaults to today and drops an empty note", () => {
    const input = formValuesToBodyMeasurementInput(form({ waist_cm: "86" }));

    expect(input.measured_on).toBe("2026-09-01");
    expect(input.notes).toBeNull();
  });
});
