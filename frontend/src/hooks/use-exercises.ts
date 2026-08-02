"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as exercisesApi from "@/lib/api/exercises";
import type { Exercise, ExerciseInput, ExerciseQuery } from "@/types/exercise";

const EXERCISES_KEY = "exercises";

export function useExercises(query: ExerciseQuery) {
  return useQuery({
    queryKey: [EXERCISES_KEY, "list", query],
    queryFn: () => exercisesApi.listExercises(query),
    placeholderData: (previous) => previous,
  });
}

export function useExercise(exerciseId: string | null) {
  return useQuery({
    queryKey: [EXERCISES_KEY, "detail", exerciseId],
    queryFn: () => exercisesApi.getExercise(exerciseId as string),
    enabled: exerciseId !== null,
  });
}

/**
 * Plan rows only store `exercise_id`, so the builder needs the whole library indexed
 * by id to render names and images. One cached request beats one per row.
 */
export function useExerciseMap() {
  const { data, isPending } = useQuery({
    queryKey: [EXERCISES_KEY, "all"],
    queryFn: () => exercisesApi.listExercises(),
    staleTime: 10 * 60 * 1000,
  });

  const exerciseMap = useMemo(
    () => new Map<string, Exercise>((data ?? []).map((item) => [item.id, item])),
    [data],
  );

  return { exerciseMap, isPending };
}

export function useExerciseFilters() {
  return useQuery({
    queryKey: [EXERCISES_KEY, "filters"],
    queryFn: exercisesApi.getExerciseFilters,
    // The glossary only changes when the trainer adds a custom exercise.
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExerciseInput) => exercisesApi.createExercise(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [EXERCISES_KEY] });
    },
  });
}

export function useUpdateExercise(exerciseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<ExerciseInput>) =>
      exercisesApi.updateExercise(exerciseId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [EXERCISES_KEY] });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exerciseId: string) => exercisesApi.deleteExercise(exerciseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [EXERCISES_KEY] });
    },
  });
}
