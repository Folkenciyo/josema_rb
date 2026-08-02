import type {
  Food,
  MacroTotals,
  MealTemplate,
  MealTemplateItemInput,
} from "@/types/diet";

export type MealItemMode = "catalog" | "manual";

export interface MealItemDraft {
  key: string;
  mode: MealItemMode;
  food_id: string | null;
  food_name: string;
  quantity_label: string;
  /** Multiplier over the food's reference unit; only meaningful in catalog mode. */
  quantity_multiplier: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const EMPTY_TOTALS: MacroTotals = {
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
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
    quantity_label: food.unit_label,
    quantity_multiplier: 1,
    calories: food.calories,
    protein_g: food.protein_g,
    carbs_g: food.carbs_g,
    fat_g: food.fat_g,
  };
}

export function createManualItem(): MealItemDraft {
  return {
    key: nextKey(),
    mode: "manual",
    food_id: null,
    food_name: "",
    quantity_label: "",
    quantity_multiplier: 1,
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  };
}

export function buildMealDraft(template: MealTemplate): MealItemDraft[] {
  return [...template.items]
    .sort((a, b) => a.order_index - b.order_index)
    .map((item) => ({
      key: item.id,
      mode: item.food_id ? "catalog" : "manual",
      food_id: item.food_id,
      food_name: item.food_name,
      quantity_label: item.quantity_label ?? "",
      quantity_multiplier: item.quantity_multiplier ?? 1,
      calories: item.calories ?? 0,
      protein_g: item.protein_g ?? 0,
      carbs_g: item.carbs_g ?? 0,
      fat_g: item.fat_g ?? 0,
    }));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Preview of what the backend will store: catalog items scale the food's macros by
 * the multiplier, manual items keep the typed values as-is.
 */
export function itemMacros(
  item: MealItemDraft,
  foods: Map<string, Food>,
): MacroTotals {
  if (item.mode === "manual") {
    return {
      calories: round(item.calories),
      protein_g: round(item.protein_g),
      carbs_g: round(item.carbs_g),
      fat_g: round(item.fat_g),
    };
  }

  const food = item.food_id ? foods.get(item.food_id) : undefined;
  if (!food) {
    return EMPTY_TOTALS;
  }

  const multiplier = item.quantity_multiplier;
  return {
    calories: round(food.calories * multiplier),
    protein_g: round(food.protein_g * multiplier),
    carbs_g: round(food.carbs_g * multiplier),
    fat_g: round(food.fat_g * multiplier),
  };
}

export function sumMacros(totals: MacroTotals[]): MacroTotals {
  return totals.reduce<MacroTotals>(
    (accumulator, current) => ({
      calories: round(accumulator.calories + current.calories),
      protein_g: round(accumulator.protein_g + current.protein_g),
      carbs_g: round(accumulator.carbs_g + current.carbs_g),
      fat_g: round(accumulator.fat_g + current.fat_g),
    }),
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
          quantity_label: item.quantity_label || null,
          quantity_multiplier: item.quantity_multiplier,
        }
      : {
          food_name: item.food_name.trim(),
          quantity_label: item.quantity_label || null,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
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
    if (item.mode === "catalog" && !(item.quantity_multiplier > 0)) {
      return "La cantidad debe ser mayor que cero.";
    }
  }

  return null;
}
