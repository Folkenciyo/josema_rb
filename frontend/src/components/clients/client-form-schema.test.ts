import {
  clientFormSchema,
  clientToFormValues,
  EMPTY_CLIENT_FORM,
  formValuesToClientInput,
} from "./client-form-schema";
import type { Client } from "@/types/client";

const client: Client = {
  id: "c1",
  full_name: "Ana Pérez",
  email: null,
  phone: "600123456",
  birth_date: "1990-05-04",
  sex: "female",
  height_cm: 168,
  goals: null,
  notes: null,
  active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("clientFormSchema", () => {
  it("requires a name", () => {
    const result = clientFormSchema.safeParse({
      ...EMPTY_CLIENT_FORM,
      full_name: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("accepts an empty email but rejects a malformed one", () => {
    expect(
      clientFormSchema.safeParse({ ...EMPTY_CLIENT_FORM, full_name: "Ana" }).success,
    ).toBe(true);
    expect(
      clientFormSchema.safeParse({
        ...EMPTY_CLIENT_FORM,
        full_name: "Ana",
        email: "no-es-un-email",
      }).success,
    ).toBe(false);
  });

  it("rejects a non-positive height", () => {
    expect(
      clientFormSchema.safeParse({
        ...EMPTY_CLIENT_FORM,
        full_name: "Ana",
        height_cm: "0",
      }).success,
    ).toBe(false);
  });
});

describe("form value mapping", () => {
  it("turns nulls into empty strings for the form", () => {
    expect(clientToFormValues(client)).toMatchObject({
      email: "",
      height_cm: "168",
      goals: "",
    });
  });

  it("turns blank fields back into nulls so they are cleared", () => {
    const input = formValuesToClientInput({
      ...EMPTY_CLIENT_FORM,
      full_name: "  Ana Pérez  ",
      phone: "600123456",
    });

    expect(input).toEqual({
      full_name: "Ana Pérez",
      email: null,
      phone: "600123456",
      birth_date: null,
      sex: null,
      height_cm: null,
      goals: null,
      notes: null,
    });
  });

  it("sends the height as a number", () => {
    const input = formValuesToClientInput({
      ...EMPTY_CLIENT_FORM,
      full_name: "Ana",
      height_cm: "168.5",
    });

    expect(input.height_cm).toBe(168.5);
  });
});
