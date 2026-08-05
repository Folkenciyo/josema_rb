"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/input";
import type { Measurement, MeasurementInput } from "@/types/measurement";
import {
  emptyMeasurementForm,
  formValuesToMeasurementInput,
  measurementFormSchema,
  measurementToFormValues,
  type MeasurementFormValues,
} from "./measurement-form-schema";

interface MeasurementFormProps {
  measurement?: Measurement;
  submitLabel: string;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (input: MeasurementInput) => void;
  onCancel: () => void;
}

export function MeasurementForm({
  measurement,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: MeasurementFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: measurement
      ? measurementToFormValues(measurement)
      : emptyMeasurementForm(),
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) =>
        onSubmit(formValuesToMeasurementInput(values)),
      )}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fecha" error={errors.measured_on?.message}>
          {(props) => (
            <Input {...props} {...register("measured_on")} type="date" />
          )}
        </Field>
        <Field label="Peso (kg)" error={errors.weight_kg?.message}>
          {(props) => (
            <Input
              {...props}
              {...register("weight_kg")}
              type="number"
              min={0}
              step="0.1"
              autoFocus
            />
          )}
        </Field>
      </div>

      <Field
        label="Notas"
        hint="Por ejemplo: en ayunas, tras vacaciones, cambio de plan…"
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
