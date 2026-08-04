import type {
  Food,
  MacroTotals,
  MealTemplate,
  MealTemplateItemInput,
} from "@/types/diet";

export type MealItemMode = "catalog" | "manual";

/** Label order: the four macros first, then the rest of the nutrition panel. */
export const NUTRIENT_KEYS = [
  "calories",
  "protein_g",
  "carbs_g",
  "sugars_g",
  "fat_g",
  "saturated_fat_g",
  "fiber_g",
  "salt_g",
] as const;

export interface MealItemDraft {
  key: string;
  mode: MealItemMode;
  food_id: string | null;
  food_name: string;
  /** Real amount served, in the food's own unit (150 for a food per 100 g). */
  quantity_amount: number;
  quantity_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  sugars_g: number;
  fat_g: number;
  saturated_fat_g: number;
  fiber_g: number;
  salt_g: number;
}

export const EMPTY_TOTALS: MacroTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  sugars_g: 0,
  fat_g: 0,
  saturated_fat_g: 0,
  fiber_g: 0,
  salt_g: 0,
};

let keyCounter = 0;

function nextKey(): string {
  keyCounter += 1;
  return `meal-item-${keyCounter}`;
}

export function createCatalogItem(food: Food): MealItemDraft {
  return {
    key: nextKey(),
    mode: "catalog",
    food_id: food.id,
    food_name: food.name,
    quantity_amount: food.unit_amount,
    quantity_unit: food.unit_type,
    ...pickNutrients(food),
  };
}

export function createManualItem(): MealItemDraft {
  return {
    key: nextKey(),
    mode: "manual",
    food_id: null,
    food_name: "",
    quantity_amount: 1,
    quantity_unit: "",
    ...EMPTY_TOTALS,
  };
}

function pickNutrients(source: MacroTotals): MacroTotals {
  return NUTRIENT_KEYS.reduce<MacroTotals>(
    (accumulator, key) => ({ ...accumulator, [key]: source[key] }),
    EMPTY_TOTALS,
  );
}

export function buildMealDraft(template: MealTemplate): MealItemDraft[] {
  return [...template.items]
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => ({
      key: item.id,
      mode: item.food_id ? "catalog" : "manual",
      food_id: item.food_id,
      food_name: item.food_name,
      quantity_amount: item.quantity_amount ?? 1,
      quantity_unit: item.quantity_unit ?? "",
      ...NUTRIENT_KEYS.reduce<MacroTotals>(
        (accumulator, key) => ({ ...accumulator, [key]: item[key] ?? 0 }),
        EMPTY_TOTALS,
      ),
    }));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Preview of what the backend will store: a catalog line scales the food's
 * values by amount/reference, a manual line keeps what was typed.
 */
export function itemMacros(
  item: MealItemDraft,
  foods: Map<string, Food>,
): MacroTotals {
  if (item.mode === "manual") {
    return pickNutrients(item);
  }

  const food = item.food_id ? foods.get(item.food_id) : undefined;
  if (!food || !(food.unit_amount > 0)) {
    return EMPTY_TOTALS;
  }

  const multiplier = item.quantity_amount / food.unit_amount;
  return NUTRIENT_KEYS.reduce<MacroTotals>(
    (accumulator, key) => ({
      ...accumulator,
      [key]: round(food[key] * multiplier),
    }),
    EMPTY_TOTALS,
  );
}

export function sumMacros(totals: MacroTotals[]): MacroTotals {
  return totals.reduce<MacroTotals>(
    (accumulator, current) =>
      NUTRIENT_KEYS.reduce<MacroTotals>(
        (partial, key) => ({
          ...partial,
          [key]: round(accumulator[key] + current[key]),
        }),
        EMPTY_TOTALS,
      ),
    EMPTY_TOTALS,
  );
}

export function mealDraftTotals(
  items: MealItemDraft[],
  foods: Map<string, Food>,
): MacroTotals {
  return sumMacros(items.map((item) => itemMacros(item, foods)));
}

export function mealDraftToPayload(
  items: MealItemDraft[],
): MealTemplateItemInput[] {
  return items.map((item) =>
    item.mode === "catalog"
      ? {
          food_id: item.food_id,
          quantity_amount: item.quantity_amount,
        }
      : {
          food_name: item.food_name.trim(),
          quantity_label: item.quantity_unit.trim() || null,
          ...pickNutrients(item),
        },
  );
}

/** Mirrors the backend rules so the trainer sees the problem before submitting. */
export function validateMealItems(items: MealItemDraft[]): string | null {
  if (items.length === 0) {
    return "Añade al menos un alimento.";
  }

  for (const item of items) {
    if (item.mode === "catalog" && !item.food_id) {
      return "Elige un alimento del catálogo en cada línea.";
    }
    if (item.mode === "manual" && item.food_name.trim() === "") {
      return "Los alimentos manuales necesitan un nombre.";
    }
    if (!(item.quantity_amount > 0)) {
      return "La cantidad debe ser mayor que cero.";
    }
    if (item.mode === "manual" && item.sugars_g > item.carbs_g) {
      return "Los azúcares no pueden superar a los hidratos.";
    }
    if (item.mode === "manual" && item.saturated_fat_g > item.fat_g) {
      return "Las grasas saturadas no pueden superar a las grasas.";
    }
  }

  return null;
}
