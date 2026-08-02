"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PLAN_STATUS_LABELS } from "@/types/common";
import type { DietPlan, DietPlanInput } from "@/types/diet-plan";

const optionalNumber = z
  .string()
  .refine((value) => value === "" || Number(value) >= 0, "Introduce un número");

const dietPlanFormSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio"),
  status: z.enum(["draft", "active", "archived"]),
  start_date: z.string(),
  end_date: z.string(),
  notes: z.string(),
  daily_calories_target: optionalNumber,
  daily_protein_g: optionalNumber,
  daily_carbs_g: optionalNumber,
  daily_fat_g: optionalNumber,
});

type DietPlanFormValues = z.infer<typeof dietPlanFormSchema>;

interface DietPlanFormProps {
  plan?: DietPlan;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (input: DietPlanInput) => void;
  onCancel: () => void;
}

function toOptionalNumber(value: string): number | null {
  return value === "" ? null : Number(value);
}

export function DietPlanForm({
  plan,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: DietPlanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DietPlanFormValues>({
    resolver: zodResolver(dietPlanFormSchema),
    defaultValues: {
      title: plan?.title ?? "",
      status: plan?.status ?? "draft",
      start_date: plan?.start_date ?? "",
      end_date: plan?.end_date ?? "",
      notes: plan?.notes ?? "",
      daily_calories_target:
        plan?.daily_calories_target === null || plan === undefined
          ? ""
          : String(plan.daily_calories_target),
      daily_protein_g:
        plan?.daily_protein_g === null || plan === undefined
          ? ""
          : String(plan.daily_protein_g),
      daily_carbs_g:
        plan?.daily_carbs_g === null || plan === undefined
          ? ""
          : String(plan.daily_carbs_g),
      daily_fat_g:
        plan?.daily_fat_g === null || plan === undefined
          ? ""
          : String(plan.daily_fat_g),
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
          notes: values.notes.trim() || null,
          daily_calories_target: toOptionalNumber(values.daily_calories_target),
          daily_protein_g: toOptionalNumber(values.daily_protein_g),
          daily_carbs_g: toOptionalNumber(values.daily_carbs_g),
          daily_fat_g: toOptionalNumber(values.daily_fat_g),
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

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">
          Objetivos diarios{" "}
          <span className="font-normal text-slate-400">(opcional)</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Calorías" error={errors.daily_calories_target?.message}>
            {(props) => (
              <Input
                {...props}
                {...register("daily_calories_target")}
                type="number"
                step="1"
              />
            )}
          </Field>
          <Field label="Proteína (g)" error={errors.daily_protein_g?.message}>
            {(props) => (
              <Input {...props} {...register("daily_protein_g")} type="number" step="1" />
            )}
          </Field>
          <Field label="Carbos (g)" error={errors.daily_carbs_g?.message}>
            {(props) => (
              <Input {...props} {...register("daily_carbs_g")} type="number" step="1" />
            )}
          </Field>
          <Field label="Grasas (g)" error={errors.daily_fat_g?.message}>
            {(props) => (
              <Input {...props} {...register("daily_fat_g")} type="number" step="1" />
            )}
          </Field>
        </div>
      </div>

      <Field label="Notas" error={errors.notes?.message}>
        {(props) => <Textarea {...props} {...register("notes")} />}
      </Field>

      <ErrorMessage error={error} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {plan ? "Guardar cambios" : "Crear plan"}
        </Button>
      </div>
    </form>
  );
}
