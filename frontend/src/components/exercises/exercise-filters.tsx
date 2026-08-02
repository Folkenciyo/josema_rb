"use client";

import { Search, X } from "lucide-react";

import { useExerciseFilters } from "@/hooks/use-exercises";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { ExerciseFilterKey } from "@/hooks/use-exercise-search";

interface ExerciseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: Record<ExerciseFilterKey, string>;
  onFilterChange: (key: ExerciseFilterKey, value: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function ExerciseFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
}: ExerciseFiltersProps) {
  const { data: options } = useExerciseFilters();

  const selects: { key: ExerciseFilterKey; label: string; values: string[] }[] = [
    { key: "muscle", label: "Músculo", values: options?.muscles ?? [] },
    { key: "equipment", label: "Equipo", values: options?.equipment ?? [] },
    { key: "category", label: "Categoría", values: options?.categories ?? [] },
    { key: "level", label: "Nivel", values: options?.levels ?? [] },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar ejercicio"
          className="pl-9"
          aria-label="Buscar ejercicio"
        />
      </div>

      {selects.map(({ key, label, values }) => (
        <Select
          key={key}
          value={filters[key]}
          onChange={(event) => onFilterChange(key, event.target.value)}
          aria-label={label}
          className="w-auto min-w-36"
        >
          <option value="">{label}</option>
          {values.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      ))}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="size-4" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
