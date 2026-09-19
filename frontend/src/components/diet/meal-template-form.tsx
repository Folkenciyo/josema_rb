"use client";

import { useState } from "react";
import { Plus, Search, Shuffle } from "lucide-react";

import { useFoodMap } from "@/hooks/use-diet-catalog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/input";
import {
  buildMealDraft,
  createCatalogItem,
  createManualItem,
  mealDraftToPayload,
  mealDraftTotals,
  nextAlternativeGroup,
  validateMealItems,
  type MealItemDraft,
} from "@/lib/diet/meal-draft";
import type { Food, MealTemplate, MealTemplateInput } from "@/types/diet";
import { AlternativeComparison } from "./alternative-comparison";
import { FoodPickerDrawer } from "./food-picker-drawer";
import { MacroSummary } from "./macro-summary";
import { MealItemRow } from "./meal-item-row";

/** Consecutive items sharing an alternative_group, kept together for display. */
function groupItems(items: MealItemDraft[]): MealItemDraft[][] {
  const groups: MealItemDraft[][] = [];
  const indexByGroup = new Map<string, number>();

  for (const item of items) {
    if (item.alternative_group && indexByGroup.has(item.alternative_group)) {
      groups[indexByGroup.get(item.alternative_group)!].push(item);
      continue;
    }
    if (item.alternative_group) {
      indexByGroup.set(item.alternative_group, groups.length);
    }
    groups.push([item]);
  }

  return groups;
}

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
  const { foodMap } = useFoodMap();

  const [name, setName] = useState(mealTemplate?.name ?? "");
  const [notes, setNotes] = useState(mealTemplate?.notes ?? "");
  const [items, setItems] = useState<MealItemDraft[]>(() =>
    mealTemplate ? buildMealDraft(mealTemplate) : [],
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPickerOpen, setPickerOpen] = useState(false);
  // "new-group" starts a fresh set of alternatives; a string is an existing
  // group's id, when adding one more option to it.
  const [alternativesTarget, setAlternativesTarget] = useState<
    "new-group" | string | null
  >(null);

  const appendItems = (foods: Food[], alternativeGroup: string | null) =>
    setItems((current) => [
      ...current,
      ...foods.map((food) => createCatalogItem(food, alternativeGroup)),
    ]);

  const removeFromGroup = (key: string) =>
    setItems((current) =>
      current.map((entry) =>
        entry.key === key ? { ...entry, alternative_group: null } : entry,
      ),
    );

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
            <Button
              type="button"
              size="sm"
              onClick={() => setPickerOpen(true)}
            >
              <Search className="size-4" />
              Buscar alimentos
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setAlternativesTarget("new-group")}
            >
              <Shuffle className="size-4" />
              Alternativas
            </Button>
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
            Busca alimentos en el catálogo o escribe uno suelto con sus macros.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {groupItems(items).map((group) => {
              const isAlternativeGroup = group.length > 1;
              const rows = group.map((item) => (
                <MealItemRow
                  key={item.key}
                  item={item}
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
              ));

              if (!isAlternativeGroup) {
                return <li key={group[0].key}>{rows}</li>;
              }

              const groupId = group[0].alternative_group!;
              return (
                <li
                  key={groupId}
                  className="flex flex-col gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50/40 p-2"
                >
                  <div className="flex items-center justify-between gap-2 px-1">
                    <p className="flex items-center gap-1 text-xs font-medium text-brand-700">
                      <Shuffle className="size-3.5" />
                      Alternativas entre sí — solo la primera cuenta en el total
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setAlternativesTarget(groupId)}
                    >
                      <Plus className="size-3.5" />
                      Añadir opción
                    </Button>
                  </div>
                  <ul className="flex flex-col gap-2">{rows}</ul>
                  <div className="flex flex-wrap gap-2 px-1">
                    {group.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => removeFromGroup(item.key)}
                        className="text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
                      >
                        Separar &quot;{item.food_name || "sin nombre"}&quot; del grupo
                      </button>
                    ))}
                  </div>
                  <AlternativeComparison items={group} foodMap={foodMap} />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-100 px-4 py-2">
        <span className="text-sm font-semibold text-slate-700">Total</span>
        <MacroSummary totals={totals} detailed />
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

      {isPickerOpen && (
        <FoodPickerDrawer
          title="Añadir alimentos"
          onClose={() => setPickerOpen(false)}
          onConfirm={(foods) => appendItems(foods, null)}
        />
      )}

      {alternativesTarget === "new-group" && (
        <FoodPickerDrawer
          title="Añadir alternativas (elige 2 o más)"
          minSelection={2}
          onClose={() => setAlternativesTarget(null)}
          onConfirm={(foods) => appendItems(foods, nextAlternativeGroup())}
        />
      )}

      {alternativesTarget && alternativesTarget !== "new-group" && (
        <FoodPickerDrawer
          title="Añadir otra alternativa"
          onClose={() => setAlternativesTarget(null)}
          onConfirm={(foods) => appendItems(foods, alternativesTarget)}
        />
      )}
    </form>
  );
}
