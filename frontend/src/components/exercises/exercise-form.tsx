"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useExerciseFilters } from "@/hooks/use-exercises";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/input";
import type { Exercise, ExerciseInput } from "@/types/exercise";
import {
  EMPTY_EXERCISE_FORM,
  exerciseFormSchema,
  exerciseToFormValues,
  splitInstructions,
  validateImages,
  type ExerciseFormValues,
} from "./exercise-form-schema";
import { ImageUpload } from "./image-upload";
import { MusclePicker } from "./muscle-picker";

interface ExerciseFormProps {
  exercise?: Exercise;
  submitLabel: string;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (input: ExerciseInput) => void;
  onCancel: () => void;
}

/** Free text with suggestions: reuses the imported glossary without locking the trainer in. */
function SuggestInput({
  options,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { options: string[] }) {
  const listId = useId();

  return (
    <>
      <Input list={listId} {...props} />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}

export function ExerciseForm({
  exercise,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: ExerciseFormProps) {
  const { data: options } = useExerciseFilters();

  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>(
    exercise?.primary_muscles_es ?? [],
  );
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>(
    exercise?.secondary_muscles_es ?? [],
  );
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: exercise
      ? exerciseToFormValues(exercise)
      : EMPTY_EXERCISE_FORM,
  });

  const submit = (values: ExerciseFormValues) => {
    const imageValidation = validateImages(images);
    setImageError(imageValidation);

    if (imageValidation) {
      return;
    }

    const optional = (value: string) => (value.trim() === "" ? null : value.trim());

    onSubmit({
      name_es: values.name_es.trim(),
      instructions_es: splitInstructions(values.instructions_text),
      category_es: optional(values.category_es),
      level_es: optional(values.level_es),
      force_es: optional(values.force_es),
      mechanic_es: optional(values.mechanic_es),
      equipment_es: optional(values.equipment_es),
      primary_muscles_es: primaryMuscles,
      secondary_muscles_es: secondaryMuscles,
      images,
    });
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(submit)} noValidate>
      <Field label="Nombre" error={errors.name_es?.message}>
        {(props) => <Input {...props} {...register("name_es")} autoFocus />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoría" error={errors.category_es?.message}>
          {(props) => (
            <SuggestInput
              {...props}
              {...register("category_es")}
              options={options?.categories ?? []}
            />
          )}
        </Field>
        <Field label="Nivel" error={errors.level_es?.message}>
          {(props) => (
            <SuggestInput
              {...props}
              {...register("level_es")}
              options={options?.levels ?? []}
            />
          )}
        </Field>
        <Field label="Equipo" error={errors.equipment_es?.message}>
          {(props) => (
            <SuggestInput
              {...props}
              {...register("equipment_es")}
              options={options?.equipment ?? []}
            />
          )}
        </Field>
        <Field label="Fuerza" error={errors.force_es?.message}>
          {(props) => (
            <SuggestInput
              {...props}
              {...register("force_es")}
              options={options?.forces ?? []}
            />
          )}
        </Field>
        <Field label="Mecánica" error={errors.mechanic_es?.message}>
          {(props) => (
            <SuggestInput
              {...props}
              {...register("mechanic_es")}
              options={options?.mechanics ?? []}
            />
          )}
        </Field>
      </div>

      <MusclePicker
        label="Músculos principales"
        options={options?.muscles ?? []}
        selected={primaryMuscles}
        onChange={setPrimaryMuscles}
      />

      <MusclePicker
        label="Músculos secundarios"
        options={options?.muscles ?? []}
        selected={secondaryMuscles}
        onChange={setSecondaryMuscles}
      />

      <Field
        label="Instrucciones"
        hint="Un paso por línea."
        error={errors.instructions_text?.message}
      >
        {(props) => (
          <Textarea {...props} {...register("instructions_text")} rows={6} />
        )}
      </Field>

      <ImageUpload
        files={images}
        onChange={setImages}
        existingImages={exercise?.images}
        error={imageError ?? undefined}
      />

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
