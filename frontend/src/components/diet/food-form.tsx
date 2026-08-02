"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import type { Food, FoodInput } from "@/types/diet";

const positiveNumber = z
  .string()
  .refine((value) => value !== "" && Number(value) >= 0, "Introduce un número");

const foodFormSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  unit_label: z.string().trim().min(1, "Indica la cantidad de referencia"),
  calories: positiveNumber,
  protein_g: positiveNumber,
  carbs_g: positiveNumber,
  fat_g: positiveNumber,
});

type FoodFormValues = z.infer<typeof foodFormSchema>;

interface FoodFormProps {
  food?: Food;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (input: FoodInput) => void;
  onCancel: () => void;
}

export function FoodForm({
  food,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: FoodFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FoodFormValues>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: {
      name: food?.name ?? "",
      unit_label: food?.unit_label ?? "100 g",
      calories: food ? String(food.calories) : "",
      protein_g: food ? String(food.protein_g) : "",
      carbs_g: food ? String(food.carbs_g) : "",
      fat_g: food ? String(food.fat_g) : "",
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          name: values.name.trim(),
          unit_label: values.unit_label.trim(),
          calories: Number(values.calories),
          protein_g: Number(values.protein_g),
          carbs_g: Number(values.carbs_g),
          fat_g: Number(values.fat_g),
        }),
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Alimento" error={errors.name?.message}>
          {(props) => <Input {...props} {...register("name")} autoFocus />}
        </Field>
        <Field
          label="Cantidad de referencia"
          hint="Las macros de abajo son para esta cantidad."
          error={errors.unit_label?.message}
        >
          {(props) => (
            <Input {...props} {...register("unit_label")} placeholder="100 g" />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Calorías" error={errors.calories?.message}>
          {(props) => (
            <Input {...props} {...register("calories")} type="number" step="0.1" />
          )}
        </Field>
        <Field label="Proteína (g)" error={errors.protein_g?.message}>
          {(props) => (
            <Input {...props} {...register("protein_g")} type="number" step="0.1" />
          )}
        </Field>
        <Field label="Carbos (g)" error={errors.carbs_g?.message}>
          {(props) => (
            <Input {...props} {...register("carbs_g")} type="number" step="0.1" />
          )}
        </Field>
        <Field label="Grasas (g)" error={errors.fat_g?.message}>
          {(props) => (
            <Input {...props} {...register("fat_g")} type="number" step="0.1" />
          )}
        </Field>
      </div>

      <ErrorMessage error={error} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {food ? "Guardar cambios" : "Crear alimento"}
        </Button>
      </div>
    </form>
  );
}
