"use client";

import { useMemo, useState } from "react";

import { useDebounce } from "./use-debounce";
import type { FoodQuery, FoodSort } from "@/types/diet";

export type FoodFilterKey =
  | "category"
  | "subcategory"
  | "min_calories"
  | "max_calories"
  | "sort";

type FilterState = Record<FoodFilterKey, string>;

const EMPTY_FILTERS: FilterState = {
  category: "",
  subcategory: "",
  min_calories: "",
  max_calories: "",
  sort: "",
};

/** Shared search state so the catalog page and the food picker behave alike. */
export function useFoodSearch() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const debouncedSearch = useDebounce(search);
  // Typing "12" in a calorie box shouldn't fire a request per keystroke.
  const debouncedMin = useDebounce(filters.min_calories);
  const debouncedMax = useDebounce(filters.max_calories);

  const query = useMemo<FoodQuery>(
    () => ({
      search: debouncedSearch,
      category: filters.category,
      subcategory: filters.subcategory,
      min_calories: debouncedMin,
      max_calories: debouncedMax,
      sort: (filters.sort || undefined) as FoodSort | undefined,
    }),
    [filters, debouncedSearch, debouncedMin, debouncedMax],
  );

  const setFilter = (key: FoodFilterKey, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setSearch("");
    setFilters(EMPTY_FILTERS);
  };

  const hasActiveFilters =
    search !== "" || Object.values(filters).some((value) => value !== "");

  return { search, setSearch, filters, setFilter, reset, query, hasActiveFilters };
}
