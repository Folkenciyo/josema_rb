"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  useCreateFood,
  useDeleteFood,
  useFoods,
  useUpdateFood,
} from "@/hooks/use-diet-catalog";
import { useFoodSearch } from "@/hooks/use-food-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import type { Food } from "@/types/diet";
import { FoodFilters } from "./food-filters";
import { FoodForm } from "./food-form";
import { MacroSummary } from "./macro-summary";

const PAGE_SIZE = 40;

export function FoodsView() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const search = useFoodSearch();
  const { data: foods, isPending, error } = useFoods(search.query);
  const createFood = useCreateFood();
  const updateFood = useUpdateFood();
  const deleteFood = useDeleteFood();

  // Reset paging during render when the query changes, instead of in an effect.
  const [lastQuery, setLastQuery] = useState(search.query);
  if (lastQuery !== search.query) {
    setLastQuery(search.query);
    setVisibleCount(PAGE_SIZE);
  }

  const visible = (foods ?? []).slice(0, visibleCount);
  const hasMore = (foods?.length ?? 0) > visibleCount;

  const handleDelete = (food: Food) => {
    if (
      window.confirm(
        `¿Eliminar "${food.name}"? Las comidas ya creadas conservan sus macros.`,
      )
    ) {
      deleteFood.mutate(food.id);
    }
  };

  return (
    <>
      <PageHeader
        title="Alimentos"
        description="Tu catálogo con la ficha nutricional completa de cada alimento."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo alimento
          </Button>
        }
      />

      <ErrorMessage error={error ?? deleteFood.error} />

      <FoodFilters
        search={search.search}
        onSearchChange={search.setSearch}
        filters={search.filters}
        onFilterChange={search.setFilter}
        onReset={search.reset}
        hasActiveFilters={search.hasActiveFilters}
      />

      <Card>
        {isPending ? (
          <LoadingState />
        ) : visible.length > 0 ? (
          <>
            <p className="border-b border-slate-100 px-5 py-2 text-xs text-slate-400">
              {foods?.length} {foods?.length === 1 ? "alimento" : "alimentos"}
            </p>
            <ul className="divide-y divide-slate-100">
              {visible.map((food) => (
                <li
                  key={food.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {food.name}{" "}
                      <span className="text-sm font-normal text-slate-400">
                        / {food.unit_label}
                      </span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge>{food.category}</Badge>
                      {food.subcategory && (
                        <span className="text-xs text-slate-400">
                          {food.subcategory}
                        </span>
                      )}
                    </div>
                    <MacroSummary totals={food} detailed className="mt-1" />
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(food)}
                      aria-label={`Editar ${food.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(food)}
                      aria-label={`Eliminar ${food.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {hasMore && (
              <div className="border-t border-slate-100 p-3 text-center">
                <Button
                  variant="secondary"
                  onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                >
                  Mostrar más
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title={
              search.hasActiveFilters
                ? "Ningún alimento coincide"
                : "Todavía no hay alimentos"
            }
            description={
              search.hasActiveFilters
                ? "Prueba con otra búsqueda o quita los filtros."
                : "Añade los que uses a menudo para no repetir macros a mano."
            }
            action={
              search.hasActiveFilters ? (
                <Button variant="secondary" onClick={search.reset}>
                  Limpiar filtros
                </Button>
              ) : (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" />
                  Nuevo alimento
                </Button>
              )
            }
          />
        )}
      </Card>

      {isCreateOpen && (
        <Modal title="Nuevo alimento" onClose={() => setCreateOpen(false)}>
          <FoodForm
            isSubmitting={createFood.isPending}
            error={createFood.error}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(input) =>
              createFood.mutate(input, { onSuccess: () => setCreateOpen(false) })
            }
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar alimento" onClose={() => setEditing(null)}>
          <FoodForm
            food={editing}
            isSubmitting={updateFood.isPending}
            error={updateFood.error}
            onCancel={() => setEditing(null)}
            onSubmit={(input) =>
              updateFood.mutate(
                { foodId: editing.id, input },
                { onSuccess: () => setEditing(null) },
              )
            }
          />
        </Modal>
      )}
    </>
  );
}
