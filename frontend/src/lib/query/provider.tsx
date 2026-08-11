"use client";

import { useState } from "react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { logout } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import {
  isExpiredSession,
  loginPathAfterExpiry,
} from "@/lib/auth/expired-session";
import { queryKeys } from "@/lib/query/keys";

/** A screen makes several calls at once; they must not all sign out in turn. */
let signingOut = false;

/**
 * An expired session anywhere in the app sends the trainer back to the login
 * screen — but the cookie has to go first. The proxy only checks that a cookie
 * exists, so leaving a dead one behind bounces /login straight back to the
 * dashboard, which fails again: the trainer ends up in a loop with no way in.
 */
function redirectOnExpiredSession(error: unknown): void {
  if (signingOut || !isExpiredSession(error, window.location.pathname)) {
    return;
  }

  signingOut = true;
  const destination = loginPathAfterExpiry(
    window.location.pathname,
    window.location.search,
  );

  // Whatever happens to the call, the trainer still has to reach the login form.
  void logout().finally(() => window.location.replace(destination));
}

function createQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: redirectOnExpiredSession }),
    mutationCache: new MutationCache({
      onError: redirectOnExpiredSession,
      // Plans, weigh-ins and clients all feed the dashboard alerts, so refreshing
      // them here spares every single mutation from remembering to do it.
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Client errors are deterministic; only retry once on network/server faults.
        retry: (failureCount, error) =>
          failureCount < 1 &&
          !(
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500
          ),
      },
    },
  });

  return queryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
