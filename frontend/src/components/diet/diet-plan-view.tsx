"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import {
  useAddDietWeek,
  useDeleteDietPlan,
  useDietPlan,
  useDuplicateDietWeek,
  useUpdateDietPlan,
} from "@/hooks/use-diet-plans";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { ExportButtons } from "@/components/plans/export-buttons";
import { WeekTabs } from "@/components/plans/week-tabs";
import { formatDateRange } from "@/lib/format";
import { planTargets } from "@/lib/diet/macro-targets";
import { DietPlanForm } from "./diet-plan-form";
import { DietWeekEditor } from "./diet-week-editor";

interface DietPlanViewProps {
  clientId: string;
  planId: string;
}

function TargetSummary({
  plan,
}: {
  plan: {
    daily_calories_target: number | null;
    daily_protein_g: number | null;
    daily_carbs_g: number | null;
    daily_fat_g: number | null;
  };
}) {
  const targets = [
    { label: "kcal", value: plan.daily_calories_target },
    { label: "P", value: plan.daily_protein_g },
    { label: "C", value: plan.daily_carbs_g },
    { label: "G", value: plan.daily_fat_g },
  ].filter((target) => target.value !== null);

  if (targets.length === 0) {
    return null;
  }

  return (
    <p className="text-sm text-slate-500">
      Objetivo diario:{" "}
      {targets.map((target) => `${target.value} ${target.label}`).join(" · ")}
    </p>
  );
}

export function DietPlanView({ clientId, planId }: DietPlanViewProps) {
  const router = useRouter();
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);

  const { data: plan, isPending, error } = useDietPlan(planId);
  const updatePlan = useUpdateDietPlan(planId, clientId);
  const deletePlan = useDeleteDietPlan(clientId);
  const addWeek = useAddDietWeek(planId);
  const duplicateWeek = useDuplicateDietWeek(planId);

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
    if (window.confirm(`¿Eliminar la dieta "${plan.title}"? No se puede deshacer.`)) {
      deletePlan.mutate(planId, {
        onSuccess: () => router.push(`/clients/${clientId}`),
      });
    }
  };

  return (
    <>
      <Link
        href={`/clients/${clientId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        Volver al cliente
      </Link>

      <PageHeader
        title={plan.title}
        description={formatDateRange(plan.start_date, plan.end_date)}
        action={
          <div className="flex flex-wrap gap-2">
            <ExportButtons basePath={`/api/diet-plans/${plan.id}`} />
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deletePlan.isPending}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={plan.status} />
        <TargetSummary plan={plan} />
        {plan.notes && <p className="text-sm text-slate-500">{plan.notes}</p>}
      </div>

      <ErrorMessage error={deletePlan.error ?? addWeek.error ?? duplicateWeek.error} />

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
          <DietWeekEditor
            key={activeWeek.id}
            planId={planId}
            week={activeWeek}
            targets={planTargets(plan)}
          />
        ) : (
          <EmptyState
            title="La dieta no tiene semanas"
            description="Añade la primera semana y asigna menús a sus días."
          />
        )}
      </Card>

      {isEditOpen && (
        <Modal title="Editar dieta" onClose={() => setEditOpen(false)}>
          <DietPlanForm
            plan={plan}
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
