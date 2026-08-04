"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { useFoods } from "@/hooks/use-diet-catalog";
import { useFoodSearch } from "@/hooks/use-food-search";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import type { Food } from "@/types/diet";
import { FoodFilters } from "./food-filters";
import { MacroSummary } from "./macro-summary";

const MAX_RESULTS = 80;

interface FoodPickerDrawerProps {
  title: string;
  onClose: () => void;
  onConfirm: (foods: Food[]) => void;
}

/** Same shape as the exercise picker: search, multi-select, add in one go. */
export function FoodPickerDrawer({
  title,
  onClose,
  onConfirm,
}: FoodPickerDrawerProps) {
  const { search, setSearch, filters, setFilter, reset, query, hasActiveFilters } =
    useFoodSearch();
  const { data: foods, isPending } = useFoods(query);
  const [selected, setSelected] = useState<Food[]>([]);

  const toggle = (food: Food) =>
    setSelected((current) =>
      current.some((entry) => entry.id === food.id)
        ? current.filter((entry) => entry.id !== food.id)
        : [...current, food],
    );

  const results = foods?.slice(0, MAX_RESULTS) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div
        className="flex-1"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4">
          <FoodFilters
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onFilterChange={setFilter}
            onReset={reset}
            hasActiveFilters={hasActiveFilters}
          />

          {isPending ? (
            <LoadingState />
          ) : results.length === 0 ? (
            <EmptyState title="Ningún alimento coincide" />
          ) : (
            <ul className="flex flex-col gap-1.5 pb-4">
              {results.map((food) => {
                const isSelected = selected.some((entry) => entry.id === food.id);

                return (
                  <li key={food.id}>
                    <button
                      type="button"
                      onClick={() => toggle(food)}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-200"
                          : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {food.name}{" "}
                          <span className="font-normal text-slate-400">
                            / {food.unit_label}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400">
                          {food.category}
                          {food.subcategory ? ` · ${food.subcategory}` : ""}
                        </p>
                        <MacroSummary totals={food} className="mt-0.5" />
                      </div>
                      {isSelected && (
                        <span className="shrink-0 rounded-full bg-amber-500 p-1 text-slate-900">
                          <Check className="size-3" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
          <p className="text-sm text-slate-500">
            {selected.length} seleccionados
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={selected.length === 0}
              onClick={() => {
                onConfirm(selected);
                onClose();
              }}
            >
              Añadir
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
