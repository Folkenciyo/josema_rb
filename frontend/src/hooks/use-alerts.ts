"use client";

import { useQuery } from "@tanstack/react-query";

import * as alertsApi from "@/lib/api/alerts";
import { queryKeys } from "@/lib/query/keys";

export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: alertsApi.getAlerts,
  });
}
