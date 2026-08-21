"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as quotesApi from "@/lib/api/quotes";
import { queryKeys } from "@/lib/query/keys";
import type { QuoteInput } from "@/types/quote";

export function useQuotes() {
  return useQuery({
    queryKey: queryKeys.quotes,
    queryFn: quotesApi.listQuotes,
  });
}

export function useQuoteQueue(days = 7) {
  return useQuery({
    queryKey: queryKeys.quoteQueue(days),
    queryFn: () => quotesApi.getQuoteQueue(days),
  });
}

/** Every change to the queue moves both the order and what is showing today. */
function useQueueMutation(action: (quoteId: string) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) => action(quoteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
  });
}

export function useShowQuoteToday() {
  return useQueueMutation(quotesApi.showQuoteToday);
}

export function useShowQuoteNext() {
  return useQueueMutation(quotesApi.showQuoteNext);
}

export function useReorderQuotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteIds: string[]) => quotesApi.reorderQuotes(quoteIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<QuoteInput>) => quotesApi.createQuote(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      quoteId,
      input,
    }: {
      quoteId: string;
      input: Partial<QuoteInput>;
    }) => quotesApi.updateQuote(quoteId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) => quotesApi.deleteQuote(quoteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
      // A deleted quote may have been pinned to any client.
      void queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function usePinnedQuote(clientId: string) {
  return useQuery({
    queryKey: queryKeys.pinnedQuote(clientId),
    queryFn: () => quotesApi.getPinnedQuote(clientId),
  });
}

export function useSetPinnedQuote(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string | null) =>
      quotesApi.setPinnedQuote(clientId, quoteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pinnedQuote(clientId),
      });
    },
  });
}
