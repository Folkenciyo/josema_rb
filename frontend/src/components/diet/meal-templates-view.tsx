"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  useCreateMealTemplate,
  useDeleteMealTemplate,
  useMealTemplates,
  useUpdateMealTemplate,
} from "@/hooks/use-diet-catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import {
  EMPTY_CATALOG_QUERY,
  filterCatalog,
  isCatalogQueryActive,
} from "@/lib/diet/catalog-search";
import type { MealTemplate } from "@/types/diet";
import { CatalogSearchBar } from "./catalog-search-bar";
import { MacroSummary } from "./macro-summary";
import { MealTemplateForm } from "./meal-template-form";

export function MealTemplatesView() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MealTemplate | null>(null);
  const [query, setQuery] = useState(EMPTY_CATALOG_QUERY);

  const { data: mealTemplates, isPending, error } = useMealTemplates();
  const visible = filterCatalog(mealTemplates ?? [], query);
  const createMealTemplate = useCreateMealTemplate();
  const updateMealTemplate = useUpdateMealTemplate();
  const deleteMealTemplate = useDeleteMealTemplate();

  const handleDelete = (mealTemplate: MealTemplate) => {
    if (window.confirm(`¿Eliminar la comida "${mealTemplate.name}"?`)) {
      deleteMealTemplate.mutate(mealTemplate.id);
    }
  };

  return (
    <>
      <PageHeader
        title="Comidas"
        description="Plantillas reutilizables que luego montas en menús."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nueva comida
          </Button>
        }
      />

      <ErrorMessage error={error ?? deleteMealTemplate.error} />

      {(mealTemplates?.length ?? 0) > 0 && (
        <CatalogSearchBar
          query={query}
          onChange={setQuery}
          placeholder="Buscar comida por nombre"
        />
      )}

      {isPending ? (
        <LoadingState />
      ) : visible.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((mealTemplate) => (
            <Card key={mealTemplate.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">
                    {mealTemplate.name}
                  </p>
                  <MacroSummary
                    totals={mealTemplate.totals}
                    detailed
                    className="mt-1"
                  />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(mealTemplate)}
                    aria-label={`Editar ${mealTemplate.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(mealTemplate)}
                    aria-label={`Eliminar ${mealTemplate.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
                {mealTemplate.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span className="truncate">{item.food_name}</span>
                    <span className="shrink-0 text-slate-400">
                      {item.quantity_label ?? ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : isCatalogQueryActive(query) ? (
        <EmptyState
          title="Ninguna comida coincide"
          description="Prueba con otro nombre o cambia el rango de calorías."
          action={
            <Button variant="secondary" onClick={() => setQuery(EMPTY_CATALOG_QUERY)}>
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Todavía no hay comidas"
          description="Crea por ejemplo un desayuno y reutilízalo en todos los menús."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Nueva comida
            </Button>
          }
        />
      )}

      {isCreateOpen && (
        <Modal title="Nueva comida" onClose={() => setCreateOpen(false)}>
          <MealTemplateForm
            isSubmitting={createMealTemplate.isPending}
            error={createMealTemplate.error}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(input) =>
              createMealTemplate.mutate(input, {
                onSuccess: () => setCreateOpen(false),
              })
            }
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar comida" onClose={() => setEditing(null)}>
          <MealTemplateForm
            mealTemplate={editing}
            isSubmitting={updateMealTemplate.isPending}
            error={updateMealTemplate.error}
            onCancel={() => setEditing(null)}
            onSubmit={(input) =>
              updateMealTemplate.mutate(
                { mealTemplateId: editing.id, input },
                { onSuccess: () => setEditing(null) },
              )
            }
          />
        </Modal>
      )}
    </>
  );
}
