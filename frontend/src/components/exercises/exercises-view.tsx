"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Plus } from "lucide-react";

import { useExerciseSearch } from "@/hooks/use-exercise-search";
import { useExercises } from "@/hooks/use-exercises";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import type { Exercise, ExerciseQuery } from "@/types/exercise";
import { ExerciseCard } from "./exercise-card";
import { ExerciseDetailModal } from "./exercise-detail-modal";
import { ExerciseFilters } from "./exercise-filters";

const PAGE_SIZE = 24;

export function ExercisesView() {
  const { search, setSearch, filters, setFilter, reset, query, hasActiveFilters } =
    useExerciseSearch();
  // The hidden ones are a separate shelf, not one more filter: this is the only
  // place they can be seen, and the only way back from being hidden.
  const [showHidden, setShowHidden] = useState(false);
  const shelfQuery = useMemo<ExerciseQuery>(
    () => (showHidden ? { ...query, visibility: "hidden" } : query),
    [query, showHidden],
  );
  const { data: exercises, isPending, error } = useExercises(shelfQuery);

  const [selected, setSelected] = useState<Exercise | null>(null);

  // The API returns the whole library at once; render it in chunks to keep it snappy.
  const queryKey = JSON.stringify(shelfQuery);
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowHidden((current) => !current)}
              title="Los ejercicios que apartaste del buscador"
            >
              {showHidden ? (
                <>
                  <Eye className="size-4" />
                  Ver el catálogo
                </>
              ) : (
                <>
                  <EyeOff className="size-4" />
                  Ver ocultos
                </>
              )}
            </Button>
            <Link href="/exercises/new">
              <Button>
                <Plus className="size-4" />
                Nuevo ejercicio
              </Button>
            </Link>
          </div>
        }
      />

      {showHidden && (
        <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
          Estás viendo los ejercicios ocultos. Ábrelos y pulsa{" "}
          <strong>Mostrar</strong> para devolverlos al catálogo.
        </p>
      )}

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
          title={
            showHidden
              ? "No has ocultado ningún ejercicio"
              : "Ningún ejercicio coincide"
          }
          description={
            showHidden
              ? "Los que apartes del buscador aparecerán aquí."
              : "Prueba con otra búsqueda o quita algún filtro."
          }
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
