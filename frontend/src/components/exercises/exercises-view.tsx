"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { useExerciseSearch } from "@/hooks/use-exercise-search";
import { useExercises } from "@/hooks/use-exercises";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import type { Exercise } from "@/types/exercise";
import { ExerciseCard } from "./exercise-card";
import { ExerciseDetailModal } from "./exercise-detail-modal";
import { ExerciseFilters } from "./exercise-filters";

const PAGE_SIZE = 24;

export function ExercisesView() {
  const { search, setSearch, filters, setFilter, reset, query, hasActiveFilters } =
    useExerciseSearch();
  const { data: exercises, isPending, error } = useExercises(query);

  const [selected, setSelected] = useState<Exercise | null>(null);

  // The API returns the whole library at once; render it in chunks to keep it snappy.
  const queryKey = JSON.stringify(query);
  const [pagination, setPagination] = useState({ queryKey, count: PAGE_SIZE });

  if (pagination.queryKey !== queryKey) {
    setPagination({ queryKey, count: PAGE_SIZE });
  }

  const total = exercises?.length ?? 0;
  const visibleExercises = exercises?.slice(0, pagination.count) ?? [];

  return (
    <>
      <PageHeader
        title="Ejercicios"
        description="Librería en español, más los ejercicios que crees tú."
        action={
          <Link href="/exercises/new">
            <Button>
              <Plus className="size-4" />
              Nuevo ejercicio
            </Button>
          </Link>
        }
      />

      <ExerciseFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={setFilter}
        onReset={reset}
        hasActiveFilters={hasActiveFilters}
      />

      {error && <ErrorMessage error={error} />}

      {isPending ? (
        <LoadingState />
      ) : total === 0 ? (
        <EmptyState
          title="Ningún ejercicio coincide"
          description="Prueba con otra búsqueda o quita algún filtro."
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">
            {total} {total === 1 ? "ejercicio" : "ejercicios"}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onSelect={setSelected}
              />
            ))}
          </div>

          {pagination.count < total && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="secondary"
                onClick={() =>
                  setPagination((current) => ({
                    ...current,
                    count: current.count + PAGE_SIZE,
                  }))
                }
              >
                Mostrar más
              </Button>
            </div>
          )}
        </>
      )}

      {selected && (
        <ExerciseDetailModal
          exercise={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
