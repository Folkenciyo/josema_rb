"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { search } from "@/lib/api/search";

/** Long enough not to query on every keystroke, short enough to feel instant. */
const DEBOUNCE_MS = 200;
const MIN_QUERY = 2;

function useDebounced(value: string): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  return debounced;
}

export function useSearch(term: string, enabled: boolean) {
  const debounced = useDebounced(term);

  return useQuery({
    queryKey: ["search", debounced],
    queryFn: () => search(debounced),
    enabled: enabled && debounced.trim().length >= MIN_QUERY,
    // Results change as the trainer edits their catalogue; a short life is enough
    // to make arrow-key browsing free without going stale.
    staleTime: 10_000,
  });
}
