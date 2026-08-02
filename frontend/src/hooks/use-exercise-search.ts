"use client";

import { useMemo, useState } from "react";

import { useDebounce } from "./use-debounce";
import type { ExerciseQuery } from "@/types/exercise";

export type ExerciseFilterKey = "muscle" | "equipment" | "category" | "level";

type FilterState = Record<ExerciseFilterKey, string>;

const EMPTY_FILTERS: FilterState = {
  muscle: "",
  equipment: "",
  category: "",
  level: "",
};

/** Shared search/filter state so the library page and the exercise picker behave alike. */
export function useExerciseSearch() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const debouncedSearch = useDebounce(search);

  const query = useMemo<ExerciseQuery>(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const setFilter = (key: ExerciseFilterKey, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setSearch("");
    setFilters(EMPTY_FILTERS);
  };

  const hasActiveFilters =
    search !== "" || Object.values(filters).some((value) => value !== "");

  return { search, setSearch, filters, setFilter, reset, query, hasActiveFilters };
}
