"use client";

import { Trash2 } from "lucide-react";

import { Input, Select } from "@/components/ui/input";
import { itemMacros, type MealItemDraft } from "@/lib/diet/meal-draft";
import type { Food } from "@/types/diet";
import { MacroSummary } from "./macro-summary";

interface MealItemRowProps {
  item: MealItemDraft;
  foods: Food[];
  foodMap: Map<string, Food>;
  onChange: (changes: Partial<Omit<MealItemDraft, "key">>) => void;
  onRemove: () => void;
}

export function MealItemRow({
  item,
  foods,
  foodMap,
  onChange,
  onRemove,
}: MealItemRowProps) {
  const macros = itemMacros(item, foodMap);
  const referenceUnit = item.food_id ? foodMap.get(item.food_id)?.unit_label : null;

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-end gap-2">
        {item.mode === "catalog" ? (
          <>
            <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs text-slate-500">
              Alimento
              <Select
                value={item.food_id ?? ""}
                onChange={(event) => {
                  const food = foodMap.get(event.target.value);
                  onChange({
                    food_id: event.target.value,
                    food_name: food?.name ?? "",
                    quantity_label: food?.unit_label ?? "",
                  });
                }}
                className="h-9"
              >
                <option value="">Elige…</option>
                {foods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex w-24 flex-col gap-1 text-xs text-slate-500">
              Cantidad
              <Input
                type="number"
                min={0}
                step="0.1"
                value={item.quantity_multiplier}
                onChange={(event) =>
                  onChange({ quantity_multiplier: Number(event.target.value) })
                }
                className="h-9"
              />
            </label>

            <label className="flex w-32 flex-col gap-1 text-xs text-slate-500">
              Se sirve como
              <Input
                value={item.quantity_label}
                onChange={(event) =>
                  onChange({ quantity_label: event.target.value })
                }
                placeholder={referenceUnit ?? "150 g"}
                className="h-9"
              />
            </label>
          </>
        ) : (
          <>
            <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs text-slate-500">
              Alimento
              <Input
                value={item.food_name}
                onChange={(event) => onChange({ food_name: event.target.value })}
                className="h-9"
              />
            </label>
            <label className="flex w-28 flex-col gap-1 text-xs text-slate-500">
              Cantidad
              <Input
                value={item.quantity_label}
                onChange={(event) =>
                  onChange({ quantity_label: event.target.value })
                }
                placeholder="1 unidad"
                className="h-9"
              />
            </label>
            {(
              [
                ["calories", "kcal"],
                ["protein_g", "P (g)"],
                ["carbs_g", "C (g)"],
                ["fat_g", "G (g)"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex w-20 flex-col gap-1 text-xs text-slate-500"
              >
                {label}
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  value={item[key]}
                  onChange={(event) =>
                    onChange({ [key]: Number(event.target.value) })
                  }
                  className="h-9"
                />
              </label>
            ))}
          </>
        )}

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${item.food_name || "alimento"}`}
          className="mb-1 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {item.mode === "catalog" && (
        <MacroSummary totals={macros} className="mt-2 border-t border-slate-100 pt-2" />
      )}
    </li>
  );
}
