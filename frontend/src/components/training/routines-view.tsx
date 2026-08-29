"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Copy, Plus } from "lucide-react";

import {
  useCreateTrainingTemplate,
  useDuplicateTrainingTemplate,
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
import type { TrainingPlan } from "@/types/training-plan";

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

function DuplicateTemplateModal({
  template,
  onClose,
}: {
  template: TrainingPlan;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(`${template.title} (copia)`);
  const duplicate = useDuplicateTrainingTemplate();

  return (
    <Modal title="Duplicar rutina" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          Se copia entera — semanas, días y ejercicios — para que la edites sin
          tocar «{template.title}».
        </p>

        <Field label="Nombre de la copia">
          {(props) => (
            <Input
              {...props}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
          )}
        </Field>

        <ErrorMessage error={duplicate.error} />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!title.trim()}
            loading={duplicate.isPending}
            onClick={() =>
              duplicate.mutate(
                { templateId: template.id, title: title.trim() },
                { onSuccess: onClose },
              )
            }
          >
            Duplicar
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
  const [duplicating, setDuplicating] = useState<TrainingPlan | null>(null);
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
            <Card
              key={template.id}
              className="hover:border-brand-300 flex items-center gap-2 p-4"
            >
              {/* The card opens the routine; the copy button sits outside the
                  link, which is also what keeps the markup valid. */}
              <Link
                href={`/routines/${template.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
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
              </Link>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDuplicating(template)}
                title="Crear una copia de esta rutina para editarla aparte"
              >
                <Copy className="size-4" />
                Duplicar
              </Button>
            </Card>
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

      {duplicating && (
        <DuplicateTemplateModal
          template={duplicating}
          onClose={() => setDuplicating(null)}
        />
      )}
    </>
  );
}
