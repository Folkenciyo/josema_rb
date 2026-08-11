"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, Pencil, Trash2 } from "lucide-react";

import {
  useAddTrainingWeek,
  useDeleteTrainingPlan,
  useDuplicateTrainingWeek,
  useSaveAsTemplate,
  useTrainingPlan,
  useUpdateTrainingPlan,
} from "@/hooks/use-training-plans";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { ExportButtons } from "@/components/plans/export-buttons";
import { PlanForm } from "@/components/plans/plan-form";
import { WeekTabs } from "@/components/plans/week-tabs";
import { formatDateRange } from "@/lib/format";
import { TrainingWeekEditor } from "./training-week-editor";

interface TrainingPlanViewProps {
  /** Absent on a template: it belongs to the trainer and to no client. */
  clientId?: string;
  planId: string;
}

export function TrainingPlanView({ clientId, planId }: TrainingPlanViewProps) {
  const router = useRouter();
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);

  const { data: plan, isPending, error } = useTrainingPlan(planId);
  const backHref = clientId ? `/clients/${clientId}` : "/routines";
  const updatePlan = useUpdateTrainingPlan(planId, clientId);
  const deletePlan = useDeleteTrainingPlan(clientId);
  const addWeek = useAddTrainingWeek(planId);
  const duplicateWeek = useDuplicateTrainingWeek(planId);
  const saveAsTemplate = useSaveAsTemplate();

  if (isPending) {
    return <LoadingState />;
  }

  if (error || !plan) {
    return <ErrorMessage error={error ?? new Error("Plan no encontrado.")} />;
  }

  const weeks = [...plan.weeks].sort((a, b) => a.week_number - b.week_number);
  const activeWeek =
    weeks.find((week) => week.id === selectedWeekId) ?? weeks[0] ?? null;
  const nextWeekNumber =
    weeks.reduce((max, week) => Math.max(max, week.week_number), 0) + 1;

  const handleDelete = () => {
    if (
      window.confirm(`¿Eliminar el plan "${plan.title}"? No se puede deshacer.`)
    ) {
      deletePlan.mutate(planId, {
        onSuccess: () => router.push(backHref),
      });
    }
  };

  return (
    <>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        {clientId ? "Volver al cliente" : "Volver a rutinas"}
      </Link>

      <PageHeader
        title={plan.title}
        description={formatDateRange(plan.start_date, plan.end_date)}
        action={
          <div className="flex flex-wrap gap-2">
            <ExportButtons basePath={`/api/training-plans/${plan.id}`} />
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
            {clientId && (
              <Button
                variant="secondary"
                onClick={() => saveAsTemplate.mutate({ planId })}
                loading={saveAsTemplate.isPending}
                title="Guardar esta rutina para reutilizarla con otros clientes"
              >
                <ClipboardList className="size-4" />
                {saveAsTemplate.isSuccess ? "Guardada" : "Guardar como rutina"}
              </Button>
            )}
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deletePlan.isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={plan.status} />
        {plan.notes && <p className="text-sm text-slate-500">{plan.notes}</p>}
      </div>

      <ErrorMessage
        error={deletePlan.error ?? addWeek.error ?? duplicateWeek.error}
      />

      <Card className="p-4">
        <WeekTabs
          weeks={weeks}
          activeWeekId={activeWeek?.id ?? null}
          onSelect={setSelectedWeekId}
          isBusy={addWeek.isPending || duplicateWeek.isPending}
          onAddWeek={() =>
            addWeek.mutate(nextWeekNumber, {
              onSuccess: (week) => setSelectedWeekId(week.id),
            })
          }
          onDuplicateWeek={() => {
            if (!activeWeek) {
              return;
            }
            duplicateWeek.mutate(
              { weekId: activeWeek.id, weekNumber: nextWeekNumber },
              { onSuccess: (week) => setSelectedWeekId(week.id) },
            );
          }}
        />

        {activeWeek ? (
          <TrainingWeekEditor
            key={activeWeek.id}
            planId={planId}
            week={activeWeek}
          />
        ) : (
          <EmptyState
            title="El plan no tiene semanas"
            description="Añade la primera semana para empezar a montar la rutina."
          />
        )}
      </Card>

      {isEditOpen && (
        <Modal title="Editar plan" onClose={() => setEditOpen(false)}>
          <PlanForm
            defaultValues={{
              title: plan.title,
              status: plan.status,
              start_date: plan.start_date ?? "",
              end_date: plan.end_date ?? "",
              notes: plan.notes ?? "",
            }}
            submitLabel="Guardar cambios"
            isSubmitting={updatePlan.isPending}
            error={updatePlan.error}
            onCancel={() => setEditOpen(false)}
            onSubmit={(input) =>
              updatePlan.mutate(input, { onSuccess: () => setEditOpen(false) })
            }
          />
        </Modal>
      )}
    </>
  );
}
