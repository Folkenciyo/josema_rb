"use client";

import { useState } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { ApiError } from "@/lib/api/http";

const LOGIN_PATH = "/login";

/** An expired session anywhere in the app sends the trainer back to the login screen. */
function redirectOnExpiredSession(error: unknown): void {
  if (
    error instanceof ApiError &&
    error.isUnauthorized &&
    window.location.pathname !== LOGIN_PATH
  ) {
    window.location.href = LOGIN_PATH;
  }
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: redirectOnExpiredSession }),
    mutationCache: new MutationCache({ onError: redirectOnExpiredSession }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Client errors are deterministic; only retry once on network/server faults.
        retry: (failureCount, error) =>
          failureCount < 1 &&
          !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
