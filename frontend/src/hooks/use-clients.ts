"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as clientsApi from "@/lib/api/clients";
import { queryKeys } from "@/lib/query/keys";
import type { ClientInput } from "@/types/client";

export function useClients(includeInactive = false) {
  return useQuery({
    queryKey: queryKeys.clients(includeInactive),
    queryFn: () => clientsApi.listClients(includeInactive),
  });
}

export function useClient(clientId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.client(clientId),
    queryFn: () => clientsApi.getClient(clientId),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ClientInput) => clientsApi.createClient(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<ClientInput>) =>
      clientsApi.updateClient(clientId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDeactivateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => clientsApi.deactivateClient(clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useReactivateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => clientsApi.reactivateClient(clientId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
