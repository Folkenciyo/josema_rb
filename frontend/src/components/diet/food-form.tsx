"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useFoodFilters } from "@/hooks/use-diet-catalog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import type { Food, FoodInput } from "@/types/diet";

const UNIT_TYPE_SUGGESTIONS = [
  "g",
  "ml",
  "unidad",
  "rebanada",
  "loncha",
  "cucharada",
  "cucharadita",
  "puñado",
  "diente",
];

const positiveNumber = z
  .string()
  .refine((value) => value !== "" && Number(value) >= 0, "Introduce un número");

const foodFormSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio"),
    category: z.string().trim().min(1, "Indica una categoría"),
    subcategory: z.string().trim(),
    unit_amount: z
      .string()
      .refine((value) => Number(value) > 0, "Debe ser mayor que cero"),
    unit_type: z.string().trim().min(1, "Indica la unidad"),
    calories: positiveNumber,
    protein_g: positiveNumber,
    carbs_g: positiveNumber,
    sugars_g: positiveNumber,
    fat_g: positiveNumber,
    saturated_fat_g: positiveNumber,
    fiber_g: positiveNumber,
    salt_g: positiveNumber,
  })
  .refine((values) => Number(values.sugars_g) <= Number(values.carbs_g), {
    message: "Los azúcares no pueden superar a los hidratos",
    path: ["sugars_g"],
  })
  .refine((values) => Number(values.saturated_fat_g) <= Number(values.fat_g), {
    message: "Las saturadas no pueden superar a las grasas",
    path: ["saturated_fat_g"],
  });

type FoodFormValues = z.infer<typeof foodFormSchema>;

const NUTRIENT_FIELDS = [
  { name: "calories", label: "Calorías (kcal)" },
  { name: "protein_g", label: "Proteínas (g)" },
  { name: "carbs_g", label: "Hidratos (g)" },
  { name: "sugars_g", label: "de los cuales azúcares (g)" },
  { name: "fat_g", label: "Grasas (g)" },
  { name: "saturated_fat_g", label: "de las cuales saturadas (g)" },
  { name: "fiber_g", label: "Fibra (g)" },
  { name: "salt_g", label: "Sal (g)" },
] as const;

interface FoodFormProps {
  food?: Food;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (input: FoodInput) => void;
  onCancel: () => void;
}

function initialValue(food: Food | undefined, key: keyof Food): string {
  return food ? String(food[key]) : "";
}

export function FoodForm({
  food,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: FoodFormProps) {
  const { data: filters } = useFoodFilters();

  // Mirrored in local state rather than read with watch(): the React Compiler
  // skips optimising any component that calls it.
  const [currentCategory, setCurrentCategory] = useState(food?.category ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FoodFormValues>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: {
      name: food?.name ?? "",
      category: food?.category ?? "",
      subcategory: food?.subcategory ?? "",
      unit_amount: food ? String(food.unit_amount) : "100",
      unit_type: food?.unit_type ?? "g",
      calories: initialValue(food, "calories"),
      protein_g: initialValue(food, "protein_g"),
      carbs_g: initialValue(food, "carbs_g"),
      sugars_g: food ? String(food.sugars_g) : "0",
      fat_g: initialValue(food, "fat_g"),
      saturated_fat_g: food ? String(food.saturated_fat_g) : "0",
      fiber_g: food ? String(food.fiber_g) : "0",
      salt_g: food ? String(food.salt_g) : "0",
    },
  });

  // Suggest only the subcategories that belong to the category being typed.
  const categoryField = register("category");
  const subcategorySuggestions = currentCategory
    ? (filters?.subcategories_by_category?.[currentCategory] ??
      filters?.subcategories ??
      [])
    : (filters?.subcategories ?? []);

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit({
          name: values.name.trim(),
          category: values.category.trim(),
          subcategory: values.subcategory.trim() || null,
          unit_amount: Number(values.unit_amount),
          unit_type: values.unit_type.trim(),
          calories: Number(values.calories),
          protein_g: Number(values.protein_g),
          carbs_g: Number(values.carbs_g),
          sugars_g: Number(values.sugars_g),
          fat_g: Number(values.fat_g),
          saturated_fat_g: Number(values.saturated_fat_g),
          fiber_g: Number(values.fiber_g),
          salt_g: Number(values.salt_g),
        }),
      )}
    >
      <datalist id="food-categories">
        {(filters?.categories ?? []).map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="food-subcategories">
        {subcategorySuggestions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="food-unit-types">
        {[...new Set([...UNIT_TYPE_SUGGESTIONS, ...(filters?.unit_types ?? [])])].map(
          (option) => (
            <option key={option} value={option} />
          ),
        )}
      </datalist>

      <Field label="Alimento" error={errors.name?.message}>
        {(props) => <Input {...props} {...register("name")} autoFocus />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoría" error={errors.category?.message}>
          {(props) => (
            <Input
              {...props}
              {...categoryField}
              onChange={(event) => {
                void categoryField.onChange(event);
                setCurrentCategory(event.target.value);
              }}
              list="food-categories"
              placeholder="Proteína animal"
            />
          )}
        </Field>
        <Field label="Subcategoría" error={errors.subcategory?.message}>
          {(props) => (
            <Input
              {...props}
              {...register("subcategory")}
              list="food-subcategories"
              placeholder="Aves"
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Cantidad de referencia"
          hint="Los valores de abajo son para esta cantidad."
          error={errors.unit_amount?.message}
        >
          {(props) => (
            <Input
              {...props}
              {...register("unit_amount")}
              type="number"
              step="0.01"
              min="0"
            />
          )}
        </Field>
        <Field
          label="Unidad"
          hint="g, ml, unidad, rebanada…"
          error={errors.unit_type?.message}
        >
          {(props) => (
            <Input {...props} {...register("unit_type")} list="food-unit-types" />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NUTRIENT_FIELDS.map(({ name, label }) => (
          <Field key={name} label={label} error={errors[name]?.message}>
            {(props) => (
              <Input
                {...props}
                {...register(name)}
                type="number"
                step="0.01"
                min="0"
              />
            )}
          </Field>
        ))}
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
