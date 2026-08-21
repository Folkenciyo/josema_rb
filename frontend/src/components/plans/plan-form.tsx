"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PLAN_STATUS_LABELS, type PlanStatus } from "@/types/common";

const planFormSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio"),
  status: z.enum(["draft", "active", "archived"]),
  start_date: z.string(),
  end_date: z.string(),
  repeats: z.boolean(),
  notes: z.string(),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;

export interface PlanFormInput {
  title: string;
  status: PlanStatus;
  start_date: string | null;
  end_date: string | null;
  repeats: boolean;
  notes: string | null;
}

interface PlanFormProps {
  defaultValues?: Partial<PlanFormValues>;
  submitLabel: string;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (input: PlanFormInput) => void;
  onCancel: () => void;
}

export function PlanForm({
  defaultValues,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: PlanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      title: "",
      status: "draft",
      start_date: "",
      end_date: "",
      repeats: false,
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          title: values.title.trim(),
          status: values.status,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
          repeats: values.repeats,
          notes: values.notes.trim() || null,
        }),
      )}
    >
      <Field label="Título" error={errors.title?.message}>
        {(props) => <Input {...props} {...register("title")} autoFocus />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Estado" error={errors.status?.message}>
          {(props) => (
            <Select {...props} {...register("status")}>
              {Object.entries(PLAN_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Inicio" error={errors.start_date?.message}>
          {(props) => <Input {...props} {...register("start_date")} type="date" />}
        </Field>
        <Field label="Fin" error={errors.end_date?.message}>
          {(props) => <Input {...props} {...register("end_date")} type="date" />}
        </Field>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          {...register("repeats")}
          className="accent-brand-600 mt-0.5 size-4"
        />
        <span>
          Repetir las semanas hasta la fecha de fin
          <span className="block text-xs text-slate-400">
            Para una rutina de una semana que se repite todo el mes. El
            calendario de la ficha proyecta el ciclo entero.
          </span>
        </span>
      </label>

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
