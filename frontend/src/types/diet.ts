/** The full label: the four macros plus what a Spanish food label must show. */
export interface MacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  sugars_g: number;
  fat_g: number;
  saturated_fat_g: number;
  fiber_g: number;
  salt_g: number;
}

export interface Food extends MacroTotals {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  /** Reference quantity the values above belong to: 100 + "g", 1 + "unidad". */
  unit_amount: number;
  unit_type: string;
  /** Derived server-side from unit_amount + unit_type, e.g. "100 g". */
  unit_label: string;
  slug: string | null;
  source: string;
}

export type FoodInput = Omit<Food, "id" | "unit_label" | "slug" | "source">;

export interface FoodFilters {
  categories: string[];
  /** Flat list, used when no category is selected yet. */
  subcategories: string[];
  /** Only the subcategories that actually exist under each category. */
  subcategories_by_category: Record<string, string[]>;
  unit_types: string[];
}

export type FoodSort = "name" | "calories" | "calories_desc" | "protein";

export interface FoodQuery {
  search?: string;
  category?: string;
  subcategory?: string;
  min_calories?: string;
  max_calories?: string;
  sort?: FoodSort;
}

export interface MealTemplateItem {
  id: string;
  food_id: string | null;
  food_name: string;
  quantity_label: string | null;
  /** Real amount served (150) and its unit ("g"). */
  quantity_amount: number | null;
  quantity_unit: string | null;
  quantity_multiplier: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  sugars_g: number | null;
  fat_g: number | null;
  saturated_fat_g: number | null;
  fiber_g: number | null;
  salt_g: number | null;
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
  /** Preferred over quantity_multiplier: the amount actually served. */
  quantity_amount?: number | null;
  quantity_multiplier?: number | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  sugars_g?: number | null;
  fat_g?: number | null;
  saturated_fat_g?: number | null;
  fiber_g?: number | null;
  salt_g?: number | null;
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
