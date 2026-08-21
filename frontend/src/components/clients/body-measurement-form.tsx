"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/input";
import { BODY_ZONES } from "@/lib/measurements/body";
import type {
  BodyMeasurement,
  BodyMeasurementInput,
} from "@/types/measurement";
import {
  bodyMeasurementFormSchema,
  bodyMeasurementToFormValues,
  emptyBodyMeasurementForm,
  formValuesToBodyMeasurementInput,
  type BodyMeasurementFormValues,
} from "./body-measurement-form-schema";

interface BodyMeasurementFormProps {
  measurement?: BodyMeasurement;
  submitLabel: string;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (input: BodyMeasurementInput) => void;
  onCancel: () => void;
}

export function BodyMeasurementForm({
  measurement,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: BodyMeasurementFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BodyMeasurementFormValues>({
    resolver: zodResolver(bodyMeasurementFormSchema),
    defaultValues: measurement
      ? bodyMeasurementToFormValues(measurement)
      : emptyBodyMeasurementForm(),
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) =>
        onSubmit(formValuesToBodyMeasurementInput(values)),
      )}
      noValidate
    >
      <Field label="Fecha" error={errors.measured_on?.message}>
        {(props) => <Input {...props} {...register("measured_on")} type="date" />}
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        {BODY_ZONES.map(({ key, label }, index) => (
          <Field key={key} label={`${label} (cm)`} error={errors[key]?.message}>
            {(props) => (
              <Input
                {...props}
                {...register(key)}
                type="number"
                min={0}
                step="0.1"
                placeholder="—"
                autoFocus={index === 0}
              />
            )}
          </Field>
        ))}
      </div>

      <Field
        label="Notas"
        hint="Deja en blanco las zonas que no hayas medido."
        error={errors.notes?.message}
      >
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
