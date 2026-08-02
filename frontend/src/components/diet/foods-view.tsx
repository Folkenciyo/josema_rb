"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  useCreateFood,
  useDeleteFood,
  useFoods,
  useUpdateFood,
} from "@/hooks/use-diet-catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import type { Food } from "@/types/diet";
import { FoodForm } from "./food-form";
import { MacroSummary } from "./macro-summary";

export function FoodsView() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);

  const { data: foods, isPending, error } = useFoods();
  const createFood = useCreateFood();
  const updateFood = useUpdateFood();
  const deleteFood = useDeleteFood();

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
        description="Tu catálogo de macros por cantidad de referencia."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo alimento
          </Button>
        }
      />

      <ErrorMessage error={error ?? deleteFood.error} />

      <Card>
        {isPending ? (
          <LoadingState />
        ) : foods && foods.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {foods.map((food) => (
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
                  <MacroSummary totals={food} className="mt-0.5" />
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
        ) : (
          <EmptyState
            title="Todavía no hay alimentos"
            description="Añade los que uses a menudo para no repetir macros a mano."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Nuevo alimento
              </Button>
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
