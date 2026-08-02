export interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface Food {
  id: string;
  name: string;
  /** Reference amount the macros belong to, e.g. "100 g". */
  unit_label: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type FoodInput = Omit<Food, "id">;

export interface MealTemplateItem {
  id: string;
  food_id: string | null;
  food_name: string;
  quantity_label: string | null;
  quantity_multiplier: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  order_index: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  notes: string | null;
  items: MealTemplateItem[];
  totals: MacroTotals;
}

/**
 * Either `food_id` (macros are computed from the catalog and stored as a snapshot)
 * or `food_name` plus the four macros.
 */
export interface MealTemplateItemInput {
  food_id?: string | null;
  food_name?: string | null;
  quantity_label?: string | null;
  quantity_multiplier?: number | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
}

export interface MealTemplateInput {
  name: string;
  notes?: string | null;
  items?: MealTemplateItemInput[];
}

export interface MenuMeal {
  id: string;
  meal_template: MealTemplate;
  order_index: number;
  time_of_day: string | null;
}

export interface Menu {
  id: string;
  name: string;
  notes: string | null;
  meals: MenuMeal[];
  totals: MacroTotals;
}

export interface MenuMealInput {
  meal_template_id: string;
  order_index: number;
  time_of_day?: string | null;
}

export interface MenuInput {
  name: string;
  notes?: string | null;
  meals?: MenuMealInput[];
}

export interface MenuSummary {
  id: string;
  name: string;
}
