"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as portalApi from "@/lib/api/portal";
import { queryKeys } from "@/lib/query/keys";

export function usePortalHome(token: string) {
  return useQuery({
    queryKey: queryKeys.portalHome(token),
    queryFn: () => portalApi.getPortalHome(token),
    // A wrong link is wrong forever; retrying only burns the rate limit.
    retry: false,
  });
}

export function usePortalTrainingPlan(token: string) {
  return useQuery({
    queryKey: queryKeys.portalTrainingPlan(token),
    queryFn: () => portalApi.getPortalTrainingPlan(token),
    retry: false,
  });
}

export function usePortalDietPlan(token: string) {
  return useQuery({
    queryKey: queryKeys.portalDietPlan(token),
    queryFn: () => portalApi.getPortalDietPlan(token),
    retry: false,
  });
}

export function usePortalMeasurements(token: string) {
  return useQuery({
    queryKey: queryKeys.portalMeasurements(token),
    queryFn: () => portalApi.getPortalMeasurements(token),
    retry: false,
  });
}

export function useRecordPortalWeighIn(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weightKg: number) =>
      portalApi.recordPortalWeighIn(token, weightKg),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal", token] });
    },
  });
}

export function useIssuePortalToken(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => portalApi.issuePortalToken(clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.client(clientId) });
    },
  });
}

export function useRevokePortalToken(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => portalApi.revokePortalToken(clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.client(clientId) });
    },
  });
}
