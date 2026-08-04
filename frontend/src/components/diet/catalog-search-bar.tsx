"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import {
  EMPTY_CATALOG_QUERY,
  isCatalogQueryActive,
  type CatalogQuery,
  type CatalogSort,
} from "@/lib/diet/catalog-search";

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "name", label: "Nombre (A-Z)" },
  { value: "calories", label: "Menos calorías" },
  { value: "calories_desc", label: "Más calorías" },
  { value: "protein", label: "Más proteína" },
];

interface CatalogSearchBarProps {
  query: CatalogQuery;
  onChange: (query: CatalogQuery) => void;
  placeholder: string;
}

/** Shared search/sort bar for the meal and menu catalogs. */
export function CatalogSearchBar({
  query,
  onChange,
  placeholder,
}: CatalogSearchBarProps) {
  const update = (changes: Partial<CatalogQuery>) =>
    onChange({ ...query, ...changes });

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query.search}
          onChange={(event) => update({ search: event.target.value })}
          placeholder={placeholder}
          className="pl-9"
          aria-label={placeholder}
        />
      </div>

      <span className="text-xs text-slate-500">kcal</span>
      <Input
        type="number"
        min={0}
        value={query.minCalories}
        onChange={(event) => update({ minCalories: event.target.value })}
        placeholder="mín."
        aria-label="Calorías mínimas"
        className="h-9 w-24"
      />
      <span className="text-xs text-slate-400">—</span>
      <Input
        type="number"
        min={0}
        value={query.maxCalories}
        onChange={(event) => update({ maxCalories: event.target.value })}
        placeholder="máx."
        aria-label="Calorías máximas"
        className="h-9 w-24"
      />

      <Select
        value={query.sort}
        onChange={(event) =>
          update({ sort: event.target.value as CatalogSort })
        }
        aria-label="Ordenar por"
        className="h-9 w-auto min-w-40"
      >
        {SORT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      {isCatalogQueryActive(query) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_CATALOG_QUERY)}
        >
          <X className="size-4" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
