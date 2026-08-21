"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as questionnaireApi from "@/lib/api/questionnaire";
import { queryKeys } from "@/lib/query/keys";
import type { QuestionInput } from "@/types/questionnaire";

export function useQuestionnaire() {
  return useQuery({
    queryKey: queryKeys.questionnaire,
    queryFn: questionnaireApi.getQuestionnaire,
  });
}

export function useSetQuestionnaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questions,
      intro,
    }: {
      questions: QuestionInput[];
      intro: string | null;
    }) => questionnaireApi.setQuestionnaire(questions, intro),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.questionnaire });
    },
  });
}

export function useClientQuestionnaire(clientId: string) {
  return useQuery({
    queryKey: queryKeys.clientQuestionnaire(clientId),
    queryFn: () => questionnaireApi.getClientQuestionnaire(clientId),
  });
}

export function usePortalQuestionnaire(token: string) {
  return useQuery({
    queryKey: queryKeys.portalQuestionnaire(token),
    queryFn: () => questionnaireApi.getPortalQuestionnaire(token),
    retry: false,
  });
}

export function useSubmitPortalQuestionnaire(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answers: { question_id: string; answer: string | null }[]) =>
      questionnaireApi.submitPortalQuestionnaire(token, answers),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal", token] });
    },
  });
}
