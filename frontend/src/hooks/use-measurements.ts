"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as measurementsApi from "@/lib/api/measurements";
import { queryKeys } from "@/lib/query/keys";
import type {
  BodyMeasurementInput,
  MeasurementInput,
} from "@/types/measurement";

export function useMeasurements(clientId: string) {
  return useQuery({
    queryKey: queryKeys.measurements(clientId),
    queryFn: () => measurementsApi.listMeasurements(clientId),
  });
}

export function useCreateMeasurement(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MeasurementInput) =>
      measurementsApi.createMeasurement(clientId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.measurements(clientId),
      });
    },
  });
}

export function useUpdateMeasurement(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      measurementId,
      input,
    }: {
      measurementId: string;
      input: Partial<MeasurementInput>;
    }) => measurementsApi.updateMeasurement(measurementId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.measurements(clientId),
      });
    },
  });
}

export function useDeleteMeasurement(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (measurementId: string) =>
      measurementsApi.deleteMeasurement(measurementId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.measurements(clientId),
      });
    },
  });
}

export function useBodyMeasurements(clientId: string) {
  return useQuery({
    queryKey: queryKeys.bodyMeasurements(clientId),
    queryFn: () => measurementsApi.listBodyMeasurements(clientId),
  });
}

/** Every body mutation refreshes the same list, so they share one invalidation. */
function useBodyMeasurementsInvalidation(clientId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.bodyMeasurements(clientId),
    });
  };
}

export function useCreateBodyMeasurement(clientId: string) {
  const onSuccess = useBodyMeasurementsInvalidation(clientId);

  return useMutation({
    mutationFn: (input: BodyMeasurementInput) =>
      measurementsApi.createBodyMeasurement(clientId, input),
    onSuccess,
  });
}

export function useUpdateBodyMeasurement(clientId: string) {
  const onSuccess = useBodyMeasurementsInvalidation(clientId);

  return useMutation({
    mutationFn: ({
      measurementId,
      input,
    }: {
      measurementId: string;
      input: Partial<BodyMeasurementInput>;
    }) => measurementsApi.updateBodyMeasurement(measurementId, input),
    onSuccess,
  });
}

export function useDeleteBodyMeasurement(clientId: string) {
  const onSuccess = useBodyMeasurementsInvalidation(clientId);

  return useMutation({
    mutationFn: (measurementId: string) =>
      measurementsApi.deleteBodyMeasurement(measurementId),
    onSuccess,
  });
}
