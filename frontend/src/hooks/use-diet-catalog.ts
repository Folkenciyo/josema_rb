"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as catalogApi from "@/lib/api/diet-catalog";
import type {
  FoodInput,
  MealTemplateInput,
  MenuInput,
} from "@/types/diet";

const FOODS_KEY = ["foods"];
const MEAL_TEMPLATES_KEY = ["meal-templates"];
const MENUS_KEY = ["menus"];

export function useFoods() {
  return useQuery({ queryKey: FOODS_KEY, queryFn: catalogApi.listFoods });
}

export function useCreateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: FoodInput) => catalogApi.createFood(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: FOODS_KEY }),
  });
}

export function useUpdateFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ foodId, input }: { foodId: string; input: Partial<FoodInput> }) =>
      catalogApi.updateFood(foodId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: FOODS_KEY }),
  });
}

export function useDeleteFood() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (foodId: string) => catalogApi.deleteFood(foodId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: FOODS_KEY }),
  });
}

export function useMealTemplates() {
  return useQuery({
    queryKey: MEAL_TEMPLATES_KEY,
    queryFn: catalogApi.listMealTemplates,
  });
}

export function useCreateMealTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MealTemplateInput) =>
      catalogApi.createMealTemplate(input),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: MEAL_TEMPLATES_KEY }),
  });
}

export function useUpdateMealTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mealTemplateId,
      input,
    }: {
      mealTemplateId: string;
      input: Partial<MealTemplateInput>;
    }) => catalogApi.updateMealTemplate(mealTemplateId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEAL_TEMPLATES_KEY });
      // Menus embed their meal templates, so their totals change too.
      void queryClient.invalidateQueries({ queryKey: MENUS_KEY });
    },
  });
}

export function useDeleteMealTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mealTemplateId: string) =>
      catalogApi.deleteMealTemplate(mealTemplateId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: MEAL_TEMPLATES_KEY }),
  });
}

export function useMenus() {
  return useQuery({ queryKey: MENUS_KEY, queryFn: catalogApi.listMenus });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MenuInput) => catalogApi.createMenu(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: MENUS_KEY }),
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuId, input }: { menuId: string; input: Partial<MenuInput> }) =>
      catalogApi.updateMenu(menuId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: MENUS_KEY }),
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (menuId: string) => catalogApi.deleteMenu(menuId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: MENUS_KEY }),
  });
}
