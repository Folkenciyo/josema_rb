"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SEX_LABELS, type Client, type ClientInput } from "@/types/client";
import {
  clientFormSchema,
  clientToFormValues,
  EMPTY_CLIENT_FORM,
  formValuesToClientInput,
  type ClientFormValues,
} from "./client-form-schema";

interface ClientFormProps {
  client?: Client;
  submitLabel: string;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (input: ClientInput) => void;
  onCancel: () => void;
}

export function ClientForm({
  client,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client ? clientToFormValues(client) : EMPTY_CLIENT_FORM,
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) =>
        onSubmit(formValuesToClientInput(values)),
      )}
      noValidate
    >
      <Field label="Nombre completo" error={errors.full_name?.message}>
        {(props) => <Input {...props} {...register("full_name")} autoFocus />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" error={errors.email?.message}>
          {(props) => <Input {...props} {...register("email")} type="email" />}
        </Field>
        <Field label="Teléfono" error={errors.phone?.message}>
          {(props) => <Input {...props} {...register("phone")} type="tel" />}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Fecha de nacimiento" error={errors.birth_date?.message}>
          {(props) => (
            <Input {...props} {...register("birth_date")} type="date" />
          )}
        </Field>
        <Field label="Sexo" error={errors.sex?.message}>
          {(props) => (
            <Select {...props} {...register("sex")}>
              <option value="">Sin especificar</option>
              {Object.entries(SEX_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Altura (cm)" error={errors.height_cm?.message}>
          {(props) => (
            <Input
              {...props}
              {...register("height_cm")}
              type="number"
              min={0}
              step="0.1"
            />
          )}
        </Field>
      </div>

      <Field label="Objetivos" error={errors.goals?.message}>
        {(props) => <Textarea {...props} {...register("goals")} />}
      </Field>

      <Field label="Notas" error={errors.notes?.message}>
        {(props) => <Textarea {...props} {...register("notes")} />}
      </Field>

      <ErrorMessage error={error} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
