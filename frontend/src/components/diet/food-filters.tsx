"use client";

import { Search, X } from "lucide-react";

import { useFoodFilters } from "@/hooks/use-diet-catalog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { FoodFilterKey } from "@/hooks/use-food-search";

const SORT_OPTIONS = [
  { value: "", label: "Nombre (A-Z)" },
  { value: "calories", label: "Menos calorías" },
  { value: "calories_desc", label: "Más calorías" },
  { value: "protein", label: "Más proteína" },
];

interface FoodFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: Record<FoodFilterKey, string>;
  onFilterChange: (key: FoodFilterKey, value: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function FoodFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
}: FoodFiltersProps) {
  const { data: options } = useFoodFilters();

  // Only the subcategories that belong to the chosen category; the flat list
  // is the fallback while no category is selected.
  const subcategories = filters.category
    ? (options?.subcategories_by_category?.[filters.category] ?? [])
    : (options?.subcategories ?? []);

  const handleCategoryChange = (value: string) => {
    onFilterChange("category", value);
    // Drop a subcategory that no longer belongs to the new category.
    const allowed = value
      ? (options?.subcategories_by_category?.[value] ?? [])
      : (options?.subcategories ?? []);
    if (filters.subcategory && !allowed.includes(filters.subcategory)) {
      onFilterChange("subcategory", "");
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar alimento por nombre"
            className="pl-9"
            aria-label="Buscar alimento"
          />
        </div>

        <Select
          value={filters.category}
          onChange={(event) => handleCategoryChange(event.target.value)}
          aria-label="Categoría"
          className="w-auto min-w-40"
        >
          <option value="">Categoría</option>
          {(options?.categories ?? []).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>

        <Select
          value={filters.subcategory}
          onChange={(event) => onFilterChange("subcategory", event.target.value)}
          aria-label="Subcategoría"
          className="w-auto min-w-40"
          disabled={subcategories.length === 0}
        >
          <option value="">
            {filters.category ? "Toda la categoría" : "Subcategoría"}
          </option>
          {subcategories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Calorías por ración</span>
        <Input
          type="number"
          min={0}
          value={filters.min_calories}
          onChange={(event) => onFilterChange("min_calories", event.target.value)}
          placeholder="mín."
          aria-label="Calorías mínimas"
          className="h-9 w-24"
        />
        <span className="text-xs text-slate-400">—</span>
        <Input
          type="number"
          min={0}
          value={filters.max_calories}
          onChange={(event) => onFilterChange("max_calories", event.target.value)}
          placeholder="máx."
          aria-label="Calorías máximas"
          className="h-9 w-24"
        />

        <Select
          value={filters.sort}
          onChange={(event) => onFilterChange("sort", event.target.value)}
          aria-label="Ordenar por"
          className="h-9 w-auto min-w-40"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="size-4" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
