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

/** Enabled only where consent stands: without it the endpoint answers 403. */
export function usePortalPhotos(token: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.portalPhotos(token),
    queryFn: () => portalApi.getPortalPhotos(token),
    enabled,
    retry: false,
  });
}

export function usePortalTrainedExercises(token: string) {
  return useQuery({
    queryKey: queryKeys.portalTrainedExercises(token),
    queryFn: () => portalApi.getPortalTrainedExercises(token),
    retry: false,
  });
}

export function usePortalExerciseHistory(token: string, exerciseId: string) {
  return useQuery({
    queryKey: queryKeys.portalExerciseHistory(token, exerciseId),
    queryFn: () => portalApi.getPortalExerciseHistory(token, exerciseId),
    retry: false,
  });
}

export function usePortalInvite(clientId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.portalInvite(clientId),
    queryFn: () => portalApi.getPortalInvite(clientId),
    // There is no invitation to fetch until the link has been issued.
    enabled,
  });
}

export function useRecordPortalWeighIn(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      weightKg,
      notes,
    }: {
      weightKg: number;
      notes: string | null;
    }) => portalApi.recordPortalWeighIn(token, weightKg, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal", token] });
    },
  });
}

function usePortalConsentMutation(
  token: string,
  action: (token: string) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => action(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal", token] });
    },
  });
}

export function useGrantPhotoConsent(token: string) {
  return usePortalConsentMutation(token, portalApi.grantPhotoConsent);
}

export function useWithdrawPhotoConsent(token: string) {
  return usePortalConsentMutation(token, portalApi.withdrawPhotoConsent);
}

export function useDeleteOwnPhotos(token: string) {
  return usePortalConsentMutation(token, portalApi.deleteOwnPhotos);
}

export function useIssuePortalToken(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => portalApi.issuePortalToken(clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.client(clientId),
      });
    },
  });
}

export function useRevokePortalToken(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => portalApi.revokePortalToken(clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.client(clientId),
      });
    },
  });
}
