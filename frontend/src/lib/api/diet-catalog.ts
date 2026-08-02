import { api } from "./http";
import type {
  Food,
  FoodInput,
  MealTemplate,
  MealTemplateInput,
  Menu,
  MenuInput,
} from "@/types/diet";

export function listFoods(): Promise<Food[]> {
  return api.get<Food[]>("/foods");
}

export function createFood(input: FoodInput): Promise<Food> {
  return api.post<Food>("/foods", input);
}

export function updateFood(
  foodId: string,
  input: Partial<FoodInput>,
): Promise<Food> {
  return api.patch<Food>(`/foods/${foodId}`, input);
}

export function deleteFood(foodId: string): Promise<void> {
  return api.delete(`/foods/${foodId}`);
}

export function listMealTemplates(): Promise<MealTemplate[]> {
  return api.get<MealTemplate[]>("/meal-templates");
}

export function createMealTemplate(
  input: MealTemplateInput,
): Promise<MealTemplate> {
  return api.post<MealTemplate>("/meal-templates", input);
}

export function updateMealTemplate(
  mealTemplateId: string,
  input: Partial<MealTemplateInput>,
): Promise<MealTemplate> {
  return api.patch<MealTemplate>(`/meal-templates/${mealTemplateId}`, input);
}

export function deleteMealTemplate(mealTemplateId: string): Promise<void> {
  return api.delete(`/meal-templates/${mealTemplateId}`);
}

export function listMenus(): Promise<Menu[]> {
  return api.get<Menu[]>("/menus");
}

export function createMenu(input: MenuInput): Promise<Menu> {
  return api.post<Menu>("/menus", input);
}

export function updateMenu(
  menuId: string,
  input: Partial<MenuInput>,
): Promise<Menu> {
  return api.patch<Menu>(`/menus/${menuId}`, input);
}

export function deleteMenu(menuId: string): Promise<void> {
  return api.delete(`/menus/${menuId}`);
}
