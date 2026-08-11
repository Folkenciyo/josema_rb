"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { useMealTemplates } from "@/hooks/use-diet-catalog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/input";
import { EMPTY_TOTALS, sumMacros } from "@/lib/diet/meal-draft";
import type { MacroTotals, Menu, MenuInput } from "@/types/diet";
import { MacroSummary } from "./macro-summary";

interface MenuMealDraft {
  key: string;
  meal_template_id: string;
  /** `HH:MM` as typed in the input; the API stores a time. */
  time_of_day: string;
}

interface MenuFormProps {
  menu?: Menu;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (input: MenuInput) => void;
  onCancel: () => void;
}

let keyCounter = 0;

function nextKey(): string {
  keyCounter += 1;
  return `menu-meal-${keyCounter}`;
}

export function MenuForm({
  menu,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: MenuFormProps) {
  const { data: mealTemplates } = useMealTemplates();
  const templates = useMemo(() => mealTemplates ?? [], [mealTemplates]);
  const templateMap = useMemo(
    () => new Map(templates.map((template) => [template.id, template])),
    [templates],
  );

  const [name, setName] = useState(menu?.name ?? "");
  const [notes, setNotes] = useState(menu?.notes ?? "");
  const [meals, setMeals] = useState<MenuMealDraft[]>(() =>
    [...(menu?.meals ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map((meal) => ({
        key: meal.id,
        meal_template_id: meal.meal_template.id,
        time_of_day: meal.time_of_day?.slice(0, 5) ?? "",
      })),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const totals: MacroTotals = sumMacros(
    meals.map(
      (meal) => templateMap.get(meal.meal_template_id)?.totals ?? EMPTY_TOTALS,
    ),
  );

  const move = (index: number, offset: number) =>
    setMeals((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) {
        return current;
      }

      const reordered = current.slice();
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (name.trim() === "") {
      setValidationError("El nombre es obligatorio.");
      return;
    }
    if (meals.length === 0) {
      setValidationError("Añade al menos una comida.");
      return;
    }
    if (meals.some((meal) => meal.meal_template_id === "")) {
      setValidationError("Elige una comida en cada línea.");
      return;
    }

    setValidationError(null);
    onSubmit({
      name: name.trim(),
      notes: notes.trim() || null,
      meals: meals.map((meal, index) => ({
        meal_template_id: meal.meal_template_id,
        order_index: index,
        time_of_day: meal.time_of_day || null,
      })),
    });
  };

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
      <Field label="Nombre del menú">
        {(props) => (
          <Input
            {...props}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Día alto en carbohidratos"
            autoFocus
          />
        )}
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">
            Comidas del día ({meals.length})
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setMeals((current) => [
                ...current,
                { key: nextKey(), meal_template_id: "", time_of_day: "" },
              ])
            }
          >
            <Plus className="size-4" />
            Añadir comida
          </Button>
        </div>

        {meals.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            El número de comidas del día es simplemente cuántas añadas aquí.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {meals.map((meal, index) => {
              const template = templateMap.get(meal.meal_template_id);

              return (
                <li
                  key={meal.key}
                  className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-surface p-3"
                >
                  <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs text-slate-500">
                    Comida
                    <Select
                      value={meal.meal_template_id}
                      onChange={(event) =>
                        setMeals((current) =>
                          current.map((entry) =>
                            entry.key === meal.key
                              ? { ...entry, meal_template_id: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      className="h-9"
                    >
                      <option value="">Elige…</option>
                      {templates.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </Select>
                  </label>

                  <label className="flex w-28 flex-col gap-1 text-xs text-slate-500">
                    Hora
                    <Input
                      type="time"
                      value={meal.time_of_day}
                      onChange={(event) =>
                        setMeals((current) =>
                          current.map((entry) =>
                            entry.key === meal.key
                              ? { ...entry, time_of_day: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      className="h-9"
                    />
                  </label>

                  {template && (
                    <MacroSummary totals={template.totals} className="mb-2 w-full" />
                  )}

                  <div className="mb-1 ml-auto flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Subir comida"
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === meals.length - 1}
                      aria-label="Bajar comida"
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMeals((current) =>
                          current.filter((entry) => entry.key !== meal.key),
                        )
                      }
                      aria-label="Quitar comida"
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-2">
        <span className="text-sm font-semibold text-slate-700">Total del día</span>
        <MacroSummary totals={totals} />
      </div>

      <Field label="Notas">
        {(props) => (
          <Textarea
            {...props}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        )}
      </Field>

      {validationError && <ErrorMessage error={new Error(validationError)} />}
      <ErrorMessage error={error} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {menu ? "Guardar cambios" : "Crear menú"}
        </Button>
      </div>
    </form>
  );
}
