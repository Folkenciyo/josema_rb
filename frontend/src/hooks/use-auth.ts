"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import * as authApi from "@/lib/api/auth";
import { queryKeys } from "@/lib/query/keys";
import type { LoginInput } from "@/types/auth";

export function useCurrentTrainer() {
  return useQuery({
    queryKey: queryKeys.currentTrainer,
    queryFn: authApi.getCurrentTrainer,
    retry: false,
  });
}

export function useLogin(redirectTo: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (trainer) => {
      queryClient.setQueryData(queryKeys.currentTrainer, trainer);
      router.replace(redirectTo);
      // The dashboard shell is proxy-guarded; refresh so it re-evaluates the cookie.
      router.refresh();
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
  });
}
