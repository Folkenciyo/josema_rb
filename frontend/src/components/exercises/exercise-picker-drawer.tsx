"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import { useExerciseSearch } from "@/hooks/use-exercise-search";
import { useExercises } from "@/hooks/use-exercises";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { ExerciseFilters } from "./exercise-filters";
import { ExerciseImage } from "./exercise-image";

const MAX_RESULTS = 60;

interface ExercisePickerDrawerProps {
  title: string;
  onClose: () => void;
  onConfirm: (exerciseIds: string[]) => void;
}

export function ExercisePickerDrawer({
  title,
  onClose,
  onConfirm,
}: ExercisePickerDrawerProps) {
  const { search, setSearch, filters, setFilter, reset, query, hasActiveFilters } =
    useExerciseSearch();
  const { data: exercises, isPending } = useExercises(query);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggle = (exerciseId: string) =>
    setSelectedIds((current) =>
      current.includes(exerciseId)
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId],
    );

  const results = exercises?.slice(0, MAX_RESULTS) ?? [];

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
          <ExerciseFilters
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
            <EmptyState title="Ningún ejercicio coincide" />
          ) : (
            <div className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-3">
              {results.map((exercise) => {
                const isSelected = selectedIds.includes(exercise.id);

                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => toggle(exercise.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "relative flex flex-col overflow-hidden rounded-lg border text-left transition-colors",
                      isSelected
                        ? "border-amber-500 ring-2 ring-amber-200"
                        : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <ExerciseImage
                      path={exercise.images[0]}
                      alt={exercise.name_es}
                      className="h-24 w-full"
                    />
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-amber-500 p-1 text-slate-900">
                        <Check className="size-3" />
                      </span>
                    )}
                    <p className="line-clamp-2 p-2 text-xs font-medium text-slate-700">
                      {exercise.name_es}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
          <p className="text-sm text-slate-500">
            {selectedIds.length} seleccionados
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={selectedIds.length === 0}
              onClick={() => {
                onConfirm(selectedIds);
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
