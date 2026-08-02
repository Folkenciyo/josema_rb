"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as plansApi from "@/lib/api/diet-plans";
import type {
  AssignMenuInput,
  DietDayInput,
  DietPlanInput,
} from "@/types/diet-plan";

const DIET_PLANS_KEY = "diet-plans";

export function useDietPlan(planId: string) {
  return useQuery({
    queryKey: [DIET_PLANS_KEY, planId],
    queryFn: () => plansApi.getDietPlan(planId),
  });
}

export function useCreateDietPlan(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DietPlanInput) =>
      plansApi.createDietPlan(clientId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useUpdateDietPlan(planId: string, clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<DietPlanInput>) =>
      plansApi.updateDietPlan(planId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DIET_PLANS_KEY, planId] });
      void queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useDeleteDietPlan(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => plansApi.deleteDietPlan(planId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useAddDietWeek(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weekNumber: number) => plansApi.addDietWeek(planId, weekNumber),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DIET_PLANS_KEY, planId] });
    },
  });
}

export function useDuplicateDietWeek(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weekId, weekNumber }: { weekId: string; weekNumber: number }) =>
      plansApi.duplicateDietWeek(weekId, weekNumber),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DIET_PLANS_KEY, planId] });
    },
  });
}

export function useSaveDietWeekDays(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weekId, days }: { weekId: string; days: DietDayInput[] }) =>
      plansApi.setDietWeekDays(weekId, days),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DIET_PLANS_KEY, planId] });
    },
  });
}

export function useAssignMenu(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weekId, input }: { weekId: string; input: AssignMenuInput }) =>
      plansApi.assignMenuToWeek(weekId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [DIET_PLANS_KEY, planId] });
    },
  });
}
