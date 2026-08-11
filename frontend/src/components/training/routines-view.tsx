"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import {
  useCreateTrainingTemplate,
  useTrainingTemplates,
} from "@/hooks/use-training-plans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "@/components/ui/feedback";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";

function NewTemplateModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const createTemplate = useCreateTrainingTemplate();

  return (
    <Modal title="Nueva rutina" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Nombre">
          {(props) => (
            <Input
              {...props}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Full body 3 días"
              autoFocus
            />
          )}
        </Field>

        <ErrorMessage error={createTemplate.error} />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!title.trim()}
            loading={createTemplate.isPending}
            onClick={() =>
              createTemplate.mutate(title.trim(), { onSuccess: onClose })
            }
          >
            Crear
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Routines that belong to nobody, ready to be dropped on any client. They are
 * plans without a client, so they open in the very same editor.
 */
export function RoutinesView() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const { data: templates, isPending, error } = useTrainingTemplates();

  return (
    <>
      <PageHeader
        title="Rutinas"
        description="Plantillas de entrenamiento listas para asignar a cualquier cliente."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nueva rutina
          </Button>
        }
      />

      <ErrorMessage error={error} />

      {isPending ? (
        <LoadingState />
      ) : templates && templates.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((template) => (
            <Link key={template.id} href={`/routines/${template.id}`}>
              <Card className="flex items-center gap-3 p-4 hover:border-amber-300">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-800">
                    {template.title}
                  </span>
                  {template.notes && (
                    <span className="block truncate text-sm text-slate-500">
                      {template.notes}
                    </span>
                  )}
                </span>
                <ChevronRight className="size-4 shrink-0 text-slate-400" />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Todavía no hay rutinas guardadas"
          description="Crea una desde cero, o guarda como rutina el plan de un cliente al que le esté funcionando."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Nueva rutina
            </Button>
          }
        />
      )}

      {isCreateOpen && (
        <NewTemplateModal onClose={() => setCreateOpen(false)} />
      )}
    </>
  );
}
