"use client";

import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { itemMacros, type MealItemDraft } from "@/lib/diet/meal-draft";
import type { Food } from "@/types/diet";
import { MacroSummary } from "./macro-summary";

const MANUAL_NUTRIENTS = [
  ["calories", "kcal"],
  ["protein_g", "P (g)"],
  ["carbs_g", "C (g)"],
  ["sugars_g", "Azúc."],
  ["fat_g", "G (g)"],
  ["saturated_fat_g", "Sat."],
  ["fiber_g", "Fibra"],
  ["salt_g", "Sal"],
] as const;

interface MealItemRowProps {
  item: MealItemDraft;
  foodMap: Map<string, Food>;
  onChange: (changes: Partial<Omit<MealItemDraft, "key">>) => void;
  onRemove: () => void;
}

export function MealItemRow({
  item,
  foodMap,
  onChange,
  onRemove,
}: MealItemRowProps) {
  const macros = itemMacros(item, foodMap);
  const food = item.food_id ? foodMap.get(item.food_id) : undefined;

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-end gap-2">
        {item.mode === "catalog" ? (
          <>
            <div className="min-w-48 flex-1">
              <p className="text-sm font-medium text-slate-800">
                {item.food_name}
              </p>
              {food && (
                <p className="text-xs text-slate-400">
                  {food.category}
                  {food.subcategory ? ` · ${food.subcategory}` : ""} · valores por{" "}
                  {food.unit_label}
                </p>
              )}
            </div>

            <label className="flex w-28 flex-col gap-1 text-xs text-slate-500">
              Cantidad
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={item.quantity_amount}
                  onChange={(event) =>
                    onChange({ quantity_amount: Number(event.target.value) })
                  }
                  className="h-9"
                  aria-label={`Cantidad de ${item.food_name}`}
                />
                <span className="text-sm text-slate-500">
                  {item.quantity_unit}
                </span>
              </div>
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
                value={item.quantity_unit}
                onChange={(event) =>
                  onChange({ quantity_unit: event.target.value })
                }
                placeholder="1 unidad"
                className="h-9"
              />
            </label>
            {MANUAL_NUTRIENTS.map(([key, label]) => (
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
        <MacroSummary
          totals={macros}
          detailed
          className="mt-2 border-t border-slate-100 pt-2"
        />
      )}
    </li>
  );
}
