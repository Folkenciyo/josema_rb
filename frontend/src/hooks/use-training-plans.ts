"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as plansApi from "@/lib/api/training-plans";
import type { TrainingDayInput, TrainingPlanInput } from "@/types/training-plan";

const TRAINING_PLANS_KEY = "training-plans";

export function useTrainingPlan(planId: string) {
  return useQuery({
    queryKey: [TRAINING_PLANS_KEY, planId],
    queryFn: () => plansApi.getTrainingPlan(planId),
  });
}

export function useCreateTrainingPlan(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TrainingPlanInput) =>
      plansApi.createTrainingPlan(clientId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useUpdateTrainingPlan(planId: string, clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<TrainingPlanInput>) =>
      plansApi.updateTrainingPlan(planId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TRAINING_PLANS_KEY, planId] });
      void queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useDeleteTrainingPlan(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => plansApi.deleteTrainingPlan(planId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useAddTrainingWeek(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weekNumber: number) =>
      plansApi.addTrainingWeek(planId, weekNumber),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TRAINING_PLANS_KEY, planId] });
    },
  });
}

export function useDuplicateTrainingWeek(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      weekId,
      weekNumber,
    }: {
      weekId: string;
      weekNumber: number;
    }) => plansApi.duplicateTrainingWeek(weekId, weekNumber),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TRAINING_PLANS_KEY, planId] });
    },
  });
}

export function useSaveTrainingWeekDays(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      weekId,
      days,
    }: {
      weekId: string;
      days: TrainingDayInput[];
    }) => plansApi.setTrainingWeekDays(weekId, days),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TRAINING_PLANS_KEY, planId] });
    },
  });
}
