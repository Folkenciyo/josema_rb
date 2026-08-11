"use client";

import { useState } from "react";
import { ClipboardList, Users } from "lucide-react";

import { useClient, useClients } from "@/hooks/use-clients";
import {
  useCopyTrainingPlan,
  useTrainingTemplates,
} from "@/hooks/use-training-plans";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import type { TrainingPlan } from "@/types/training-plan";

type Source = "templates" | "clients";

function SourceTab({
  isActive,
  onClick,
  icon,
  label,
}: {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium",
        isActive
          ? "bg-amber-500 text-slate-900"
          : "text-slate-600 hover:bg-slate-100",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PlanList({
  plans,
  onPick,
  isCopying,
}: {
  plans: { plan: TrainingPlan; subtitle: string }[];
  onPick: (planId: string) => void;
  isCopying: boolean;
}) {
  if (plans.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        Aquí no hay nada que copiar todavía.
      </p>
    );
  }

  return (
    <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
      {plans.map(({ plan, subtitle }) => (
        <li key={plan.id}>
          <button
            type="button"
            disabled={isCopying}
            onClick={() => onPick(plan.id)}
            className="flex w-full flex-col items-start px-1 py-2.5 text-left hover:bg-slate-50 disabled:opacity-50"
          >
            <span className="font-medium text-slate-800">{plan.title}</span>
            <span className="text-sm text-slate-500">{subtitle}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Start a client's routine from something that already exists: a saved template
 * or what is working for somebody else. The copy is a draft, never the plan in
 * charge.
 */
export function UseRoutineModal({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const [source, setSource] = useState<Source>("templates");
  const { data: templates, isPending: loadingTemplates } =
    useTrainingTemplates();
  const { data: clients } = useClients();
  const copyPlan = useCopyTrainingPlan(clientId);

  const others = (clients ?? []).filter((client) => client.id !== clientId);

  return (
    <Modal title="Usar una rutina existente" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          <SourceTab
            isActive={source === "templates"}
            onClick={() => setSource("templates")}
            icon={<ClipboardList className="size-4" />}
            label="Mis rutinas"
          />
          <SourceTab
            isActive={source === "clients"}
            onClick={() => setSource("clients")}
            icon={<Users className="size-4" />}
            label="De otro cliente"
          />
        </div>

        <ErrorMessage error={copyPlan.error} />

        {source === "templates" ? (
          loadingTemplates ? (
            <Spinner className="size-4" />
          ) : (
            <PlanList
              plans={(templates ?? []).map((plan) => ({
                plan,
                subtitle: plan.notes ?? "Plantilla guardada",
              }))}
              onPick={(planId) =>
                copyPlan.mutate(
                  { sourcePlanId: planId },
                  { onSuccess: onClose },
                )
              }
              isCopying={copyPlan.isPending}
            />
          )
        ) : (
          <ClientPlans
            clients={others}
            onPick={(planId, clientName) =>
              copyPlan.mutate(
                { sourcePlanId: planId, title: `Rutina de ${clientName}` },
                { onSuccess: onClose },
              )
            }
            isCopying={copyPlan.isPending}
          />
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** The routines of every other client, so the trainer can lift one wholesale. */
function ClientPlans({
  clients,
  onPick,
  isCopying,
}: {
  clients: { id: string; full_name: string }[];
  onPick: (planId: string, clientName: string) => void;
  isCopying: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: client } = useClientDetail(selected);

  return (
    <div className="flex flex-col gap-3">
      <select
        value={selected ?? ""}
        onChange={(event) => setSelected(event.target.value || null)}
        className="bg-surface w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
      >
        <option value="">Elige un cliente…</option>
        {clients.map((other) => (
          <option key={other.id} value={other.id}>
            {other.full_name}
          </option>
        ))}
      </select>

      {client && (
        <PlanList
          plans={client.training_plans.map((plan) => ({
            plan: plan as unknown as TrainingPlan,
            subtitle: plan.status === "active" ? "En curso" : "Archivado",
          }))}
          onPick={(planId) => onPick(planId, client.full_name)}
          isCopying={isCopying}
        />
      )}
    </div>
  );
}

function useClientDetail(clientId: string | null) {
  return useClient(clientId ?? "", { enabled: clientId !== null });
}
