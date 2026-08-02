import { z } from "zod";

import type { Client, ClientInput } from "@/types/client";

export const clientFormSchema = z.object({
  full_name: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.union([z.literal(""), z.email("Email no válido")]),
  phone: z.string(),
  birth_date: z.string(),
  sex: z.string(),
  height_cm: z
    .string()
    .refine(
      (value) => value === "" || Number(value) > 0,
      "Introduce una altura válida en cm",
    ),
  goals: z.string(),
  notes: z.string(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

export const EMPTY_CLIENT_FORM: ClientFormValues = {
  full_name: "",
  email: "",
  phone: "",
  birth_date: "",
  sex: "",
  height_cm: "",
  goals: "",
  notes: "",
};

export function clientToFormValues(client: Client): ClientFormValues {
  return {
    full_name: client.full_name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    birth_date: client.birth_date ?? "",
    sex: client.sex ?? "",
    height_cm: client.height_cm === null ? "" : String(client.height_cm),
    goals: client.goals ?? "",
    notes: client.notes ?? "",
  };
}

/** Empty strings become null so optional fields are cleared instead of stored blank. */
export function formValuesToClientInput(values: ClientFormValues): ClientInput {
  const optional = (value: string) => (value.trim() === "" ? null : value.trim());

  return {
    full_name: values.full_name.trim(),
    email: optional(values.email),
    phone: optional(values.phone),
    birth_date: optional(values.birth_date),
    sex: optional(values.sex),
    height_cm: values.height_cm === "" ? null : Number(values.height_cm),
    goals: optional(values.goals),
    notes: optional(values.notes),
  };
}
