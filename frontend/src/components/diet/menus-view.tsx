"use client";

import { useState } from "react";
import { Clock, Pencil, Plus, Trash2 } from "lucide-react";

import {
  useCreateMenu,
  useDeleteMenu,
  useMenus,
  useUpdateMenu,
} from "@/hooks/use-diet-catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import type { Menu } from "@/types/diet";
import { MacroSummary } from "./macro-summary";
import { MenuForm } from "./menu-form";

export function MenusView() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);

  const { data: menus, isPending, error } = useMenus();
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();
  const deleteMenu = useDeleteMenu();

  const handleDelete = (menu: Menu) => {
    if (window.confirm(`¿Eliminar el menú "${menu.name}"?`)) {
      deleteMenu.mutate(menu.id);
    }
  };

  return (
    <>
      <PageHeader
        title="Menús"
        description="Un menú es un día completo de comidas, listo para asignar a una dieta."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo menú
          </Button>
        }
      />

      <ErrorMessage error={error ?? deleteMenu.error} />

      {isPending ? (
        <LoadingState />
      ) : menus && menus.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {menus.map((menu) => (
            <Card key={menu.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">
                    {menu.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {menu.meals.length}{" "}
                    {menu.meals.length === 1 ? "comida" : "comidas"}
                  </p>
                  <MacroSummary totals={menu.totals} className="mt-1" />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(menu)}
                    aria-label={`Editar ${menu.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(menu)}
                    aria-label={`Eliminar ${menu.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
                {[...menu.meals]
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((meal) => (
                    <li key={meal.id} className="flex items-center gap-2">
                      {meal.time_of_day && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="size-3" />
                          {meal.time_of_day.slice(0, 5)}
                        </span>
                      )}
                      <span className="truncate">{meal.meal_template.name}</span>
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Todavía no hay menús"
          description="Monta un día completo con las comidas que ya tienes creadas."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Nuevo menú
            </Button>
          }
        />
      )}

      {isCreateOpen && (
        <Modal title="Nuevo menú" onClose={() => setCreateOpen(false)}>
          <MenuForm
            isSubmitting={createMenu.isPending}
            error={createMenu.error}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(input) =>
              createMenu.mutate(input, { onSuccess: () => setCreateOpen(false) })
            }
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar menú" onClose={() => setEditing(null)}>
          <MenuForm
            menu={editing}
            isSubmitting={updateMenu.isPending}
            error={updateMenu.error}
            onCancel={() => setEditing(null)}
            onSubmit={(input) =>
              updateMenu.mutate(
                { menuId: editing.id, input },
                { onSuccess: () => setEditing(null) },
              )
            }
          />
        </Modal>
      )}
    </>
  );
}
