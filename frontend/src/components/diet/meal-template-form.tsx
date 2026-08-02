"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { useFoods } from "@/hooks/use-diet-catalog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  buildMealDraft,
  createCatalogItem,
  createManualItem,
  mealDraftToPayload,
  mealDraftTotals,
  validateMealItems,
  type MealItemDraft,
} from "@/lib/diet/meal-draft";
import type { MealTemplate, MealTemplateInput } from "@/types/diet";
import { MacroSummary } from "./macro-summary";
import { MealItemRow } from "./meal-item-row";

interface MealTemplateFormProps {
  mealTemplate?: MealTemplate;
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (input: MealTemplateInput) => void;
  onCancel: () => void;
}

export function MealTemplateForm({
  mealTemplate,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: MealTemplateFormProps) {
  const { data: foods } = useFoods();
  const foodList = useMemo(() => foods ?? [], [foods]);
  const foodMap = useMemo(
    () => new Map(foodList.map((food) => [food.id, food])),
    [foodList],
  );

  const [name, setName] = useState(mealTemplate?.name ?? "");
  const [notes, setNotes] = useState(mealTemplate?.notes ?? "");
  const [items, setItems] = useState<MealItemDraft[]>(() =>
    mealTemplate ? buildMealDraft(mealTemplate) : [],
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const totals = mealDraftTotals(items, foodMap);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (name.trim() === "") {
      setValidationError("El nombre es obligatorio.");
      return;
    }

    const itemsError = validateMealItems(items);
    setValidationError(itemsError);

    if (itemsError) {
      return;
    }

    onSubmit({
      name: name.trim(),
      notes: notes.trim() || null,
      items: mealDraftToPayload(items),
    });
  };

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
      <Field label="Nombre de la comida">
        {(props) => (
          <Input
            {...props}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Desayuno proteico"
            autoFocus
          />
        )}
      </Field>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700">Alimentos</p>
          <div className="flex items-center gap-2">
            <Select
              value=""
              aria-label="Añadir alimento del catálogo"
              className="h-8 w-auto min-w-44 text-xs"
              onChange={(event) => {
                const food = foodMap.get(event.target.value);
                if (food) {
                  setItems((current) => [...current, createCatalogItem(food)]);
                }
              }}
            >
              <option value="">Añadir del catálogo…</option>
              {foodList.map((food) => (
                <option key={food.id} value={food.id}>
                  {food.name}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setItems((current) => [...current, createManualItem()])}
            >
              <Plus className="size-4" />
              Manual
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Añade alimentos del catálogo o escribe uno suelto con sus macros.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <MealItemRow
                key={item.key}
                item={item}
                foods={foodList}
                foodMap={foodMap}
                onChange={(changes) =>
                  setItems((current) =>
                    current.map((entry) =>
                      entry.key === item.key ? { ...entry, ...changes } : entry,
                    ),
                  )
                }
                onRemove={() =>
                  setItems((current) =>
                    current.filter((entry) => entry.key !== item.key),
                  )
                }
              />
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-slate-100 px-4 py-2">
        <span className="text-sm font-semibold text-slate-700">Total</span>
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

      {validationError && (
        <ErrorMessage error={new Error(validationError)} />
      )}
      <ErrorMessage error={error} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {mealTemplate ? "Guardar cambios" : "Crear comida"}
        </Button>
      </div>
    </form>
  );
}
