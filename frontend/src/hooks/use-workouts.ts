"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import * as workoutsApi from "@/lib/api/workouts";
import { ApiError } from "@/lib/api/http";
import { queryKeys } from "@/lib/query/keys";
import {
  acknowledgeSession,
  dismissRejection,
  getServerSnapshot,
  getSnapshot,
  rejectSession,
  subscribe,
} from "@/lib/workout/session-store";
import { isWorthRetrying } from "@/lib/workout/storage";

export function useWorkoutDays(token: string) {
  return useQuery({
    queryKey: queryKeys.workoutDays(token),
    queryFn: () => workoutsApi.getWorkoutDays(token),
    retry: false,
  });
}

export function useWorkoutDay(token: string, dayId: string) {
  return useQuery({
    queryKey: queryKeys.workoutDay(token, dayId),
    queryFn: () => workoutsApi.getWorkoutDay(token, dayId),
    retry: false,
  });
}

export function usePortalWorkouts(token: string) {
  return useQuery({
    queryKey: queryKeys.portalWorkouts(token),
    queryFn: () => workoutsApi.getPortalWorkouts(token),
    retry: false,
  });
}

export function useWorkoutState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useClientWorkouts(clientId: string) {
  return useQuery({
    queryKey: queryKeys.clientWorkouts(clientId),
    queryFn: () => workoutsApi.getClientWorkouts(clientId),
  });
}

export function useClientWorkout(clientId: string, sessionId: string) {
  return useQuery({
    queryKey: [...queryKeys.clientWorkouts(clientId), sessionId],
    queryFn: () => workoutsApi.getClientWorkout(clientId, sessionId),
  });
}

export function useExerciseHistory(clientId: string, exerciseId: string) {
  return useQuery({
    queryKey: queryKeys.exerciseHistory(clientId, exerciseId),
    queryFn: () => workoutsApi.getExerciseHistory(clientId, exerciseId),
  });
}

/**
 * Empties the queue of finished sessions: on load, whenever the phone reports it
 * is back online, and right after a session is finished.
 */
export function useWorkoutSync(token: string) {
  const { queue, rejected } = useWorkoutState();
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);

  const flush = useCallback(async () => {
    const pending = getSnapshot().queue;
    if (pending.length === 0) {
      return;
    }

    setIsSending(true);
    try {
      for (const session of pending) {
        try {
          await workoutsApi.recordWorkout(token, session.payload);
          acknowledgeSession(session.payload.device_session_id);
        } catch (error) {
          const status = error instanceof ApiError ? error.status : 0;
          if (isWorthRetrying(status)) {
            // Still no coverage, or the server is having a bad day: keep it and
            // stop here, so the sessions stay in the order they were trained.
            break;
          }
          // It will be refused the same way forever. Say so instead of retrying.
          rejectSession(
            session.payload.device_session_id,
            error instanceof ApiError
              ? error.message
              : "No se ha podido guardar la sesión.",
          );
        }
      }
      void queryClient.invalidateQueries({ queryKey: ["portal", token] });
    } finally {
      setIsSending(false);
    }
  }, [queryClient, token]);

  useEffect(() => {
    // Sending starts once the screen is painted: the client came here to see
    // their routine, not to wait on last week's session reaching the server.
    const onMount = setTimeout(() => void flush(), 0);

    window.addEventListener("online", flush);
    return () => {
      clearTimeout(onMount);
      window.removeEventListener("online", flush);
    };
  }, [flush]);

  return {
    pendingCount: queue.length,
    isSending,
    rejected,
    dismissRejected: dismissRejection,
    flush,
  };
}
