"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as settingsApi from "@/lib/api/settings";
import { queryKeys } from "@/lib/query/keys";
import type { InviteTemplatesInput } from "@/types/settings";

export function useInviteTemplates() {
  return useQuery({
    queryKey: queryKeys.inviteTemplates,
    queryFn: settingsApi.getInviteTemplates,
  });
}

export function useUpdateInviteTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InviteTemplatesInput) =>
      settingsApi.updateInviteTemplates(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inviteTemplates });
      // Every client's ready-made message changes with the template.
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
