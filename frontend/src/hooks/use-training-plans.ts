"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as plansApi from "@/lib/api/training-plans";
import type {
  TrainingDayInput,
  TrainingPlanInput,
} from "@/types/training-plan";

const TEMPLATES_KEY = ["training-templates"] as const;

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
      // A template has no client file to refresh; the library does instead.
      void queryClient.invalidateQueries({
        queryKey: clientId ? ["clients", clientId] : TEMPLATES_KEY,
      });
    },
  });
}

export function useUpdateTrainingPlan(planId: string, clientId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<TrainingPlanInput>) =>
      plansApi.updateTrainingPlan(planId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [TRAINING_PLANS_KEY, planId],
      });
      // A template has no client file to refresh; the library does instead.
      void queryClient.invalidateQueries({
        queryKey: clientId ? ["clients", clientId] : TEMPLATES_KEY,
      });
    },
  });
}

export function useDeleteTrainingPlan(clientId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => plansApi.deleteTrainingPlan(planId),
    onSuccess: () => {
      // A template has no client file to refresh; the library does instead.
      void queryClient.invalidateQueries({
        queryKey: clientId ? ["clients", clientId] : TEMPLATES_KEY,
      });
    },
  });
}

export function useAddTrainingWeek(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weekNumber: number) =>
      plansApi.addTrainingWeek(planId, weekNumber),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [TRAINING_PLANS_KEY, planId],
      });
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
      void queryClient.invalidateQueries({
        queryKey: [TRAINING_PLANS_KEY, planId],
      });
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
      void queryClient.invalidateQueries({
        queryKey: [TRAINING_PLANS_KEY, planId],
      });
    },
  });
}

export function useTrainingTemplates() {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: plansApi.listTrainingTemplates,
  });
}

export function useCreateTrainingTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) => plansApi.createTrainingTemplate(title),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

/** Starts this client from a template, or from what already works for another. */
export function useCopyTrainingPlan(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourcePlanId,
      title,
    }: {
      sourcePlanId: string;
      title?: string;
    }) => plansApi.copyTrainingPlanToClient(clientId, sourcePlanId, title),
    onSuccess: () => {
      // A template has no client file to refresh; the library does instead.
      void queryClient.invalidateQueries({
        queryKey: clientId ? ["clients", clientId] : TEMPLATES_KEY,
      });
    },
  });
}

export function useSaveAsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, title }: { planId: string; title?: string }) =>
      plansApi.saveTrainingPlanAsTemplate(planId, title),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}
