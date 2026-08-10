"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Pencil, RotateCcw, UserMinus } from "lucide-react";

import {
  useClient,
  useDeactivateClient,
  useReactivateClient,
  useUpdateClient,
} from "@/hooks/use-clients";
import { useCreateTrainingPlan } from "@/hooks/use-training-plans";
import { useCreateDietPlan } from "@/hooks/use-diet-plans";
import { PlanForm } from "@/components/plans/plan-form";
import { DietPlanForm } from "@/components/diet/diet-plan-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { toMailtoHref, toTelHref, toWhatsAppHref } from "@/lib/contact";
import { calculateAge, formatDate } from "@/lib/format";
import { SEX_LABELS, type ClientDetail, type Sex } from "@/types/client";
import { ClientForm } from "./client-form";
import { MeasurementsCard } from "./measurements-card";
import { PhotosSummaryCard } from "./photos-summary-card";
import { PlanHistoryCard } from "./plan-history-card";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-5 py-2.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

/** Contact details are links so the trainer can write or call straight from the phone. */
function ContactValue({ href, text }: { href: string | null; text: string | null }) {
  if (!text) {
    return <>—</>;
  }

  if (!href) {
    return <>{text}</>;
  }

  return (
    <a href={href} className="text-amber-700 hover:underline">
      {text}
    </a>
  );
}

function ClientProfileCard({ client }: { client: ClientDetail }) {
  const age = calculateAge(client.birth_date);
  const sexLabel = client.sex ? (SEX_LABELS[client.sex as Sex] ?? client.sex) : "—";
  const whatsAppHref = toWhatsAppHref(client.phone);

  return (
    <Card>
      <CardHeader title="Ficha" />
      <div className="divide-y divide-slate-100">
        <DetailRow
          label="Email"
          value={<ContactValue href={toMailtoHref(client.email)} text={client.email} />}
        />
        <DetailRow
          label="Teléfono"
          value={
            <span className="inline-flex items-center gap-2">
              <ContactValue href={toTelHref(client.phone)} text={client.phone} />
              {whatsAppHref && (
                <a
                  href={whatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Escribir por WhatsApp"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle className="size-4" />
                  <span className="sr-only">Escribir por WhatsApp</span>
                </a>
              )}
            </span>
          }
        />
        <DetailRow
          label="Nacimiento"
          value={
            client.birth_date
              ? `${formatDate(client.birth_date)}${age !== null ? ` (${age} años)` : ""}`
              : "—"
          }
        />
        <DetailRow label="Sexo" value={sexLabel} />
        <DetailRow
          label="Altura"
          value={client.height_cm ? `${client.height_cm} cm` : "—"}
        />
        <DetailRow label="Cliente desde" value={formatDate(client.created_at)} />
      </div>
      {(client.goals || client.notes) && (
        <div className="space-y-3 border-t border-slate-100 px-5 py-4">
          {client.goals && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Objetivos
              </p>
              <p className="mt-1 text-sm whitespace-pre-line text-slate-700">
                {client.goals}
              </p>
            </div>
          )}
          {client.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Notas
              </p>
              <p className="mt-1 text-sm whitespace-pre-line text-slate-700">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function ClientDetailView({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [isEditOpen, setEditOpen] = useState(false);
  const [isTrainingPlanOpen, setTrainingPlanOpen] = useState(false);
  const [isDietPlanOpen, setDietPlanOpen] = useState(false);

  const { data: client, isPending, error } = useClient(clientId);
  const updateClient = useUpdateClient(clientId);
  const deactivateClient = useDeactivateClient();
  const reactivateClient = useReactivateClient();
  const createTrainingPlan = useCreateTrainingPlan(clientId);
  const createDietPlan = useCreateDietPlan(clientId);

  if (isPending) {
    return <LoadingState />;
  }

  if (error || !client) {
    return <ErrorMessage error={error ?? new Error("Cliente no encontrado.")} />;
  }

  const handleDeactivate = () => {
    if (
      window.confirm(
        `¿Marcar a ${client.full_name} como inactivo? Su historial de planes se conserva.`,
      )
    ) {
      deactivateClient.mutate(clientId, {
        onSuccess: () => router.push("/clients"),
      });
    }
  };

  return (
    <>
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        Clientes
      </Link>

      <PageHeader
        title={client.full_name}
        description={client.active ? undefined : "Cliente inactivo"}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
            {client.active ? (
              <Button
                variant="danger"
                onClick={handleDeactivate}
                loading={deactivateClient.isPending}
              >
                <UserMinus className="size-4" />
                Desactivar
              </Button>
            ) : (
              <Button
                onClick={() => reactivateClient.mutate(clientId)}
                loading={reactivateClient.isPending}
              >
                <RotateCcw className="size-4" />
                Reactivar
              </Button>
            )}
          </div>
        }
      />

      {!client.active && (
        <div className="mb-4">
          <Badge className="bg-slate-200 text-slate-600">Inactivo</Badge>
        </div>
      )}

      <ErrorMessage error={deactivateClient.error ?? reactivateClient.error} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <ClientProfileCard client={client} />
          <MeasurementsCard
            clientId={clientId}
            hasHeight={Boolean(client.height_cm)}
          />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <PlanHistoryCard
            title="Planes de entrenamiento"
            plans={client.training_plans}
            emptyDescription="Aquí aparecerá el historial de rutinas de este cliente."
            buildHref={(planId) => `/clients/${clientId}/training-plans/${planId}`}
            onCreate={() => setTrainingPlanOpen(true)}
          />
          <PlanHistoryCard
            title="Planes de dieta"
            plans={client.diet_plans}
            emptyDescription="Aquí aparecerá el historial de dietas de este cliente."
            buildHref={(planId) => `/clients/${clientId}/diet-plans/${planId}`}
            onCreate={() => setDietPlanOpen(true)}
          />
          <PhotosSummaryCard clientId={clientId} />
        </div>
      </div>

      {isTrainingPlanOpen && (
        <Modal
          title="Nuevo plan de entrenamiento"
          onClose={() => setTrainingPlanOpen(false)}
        >
          <PlanForm
            submitLabel="Crear plan"
            isSubmitting={createTrainingPlan.isPending}
            error={createTrainingPlan.error}
            onCancel={() => setTrainingPlanOpen(false)}
            onSubmit={(input) =>
              createTrainingPlan.mutate(input, {
                onSuccess: (plan) =>
                  router.push(`/clients/${clientId}/training-plans/${plan.id}`),
              })
            }
          />
        </Modal>
      )}

      {isDietPlanOpen && (
        <Modal title="Nueva dieta" onClose={() => setDietPlanOpen(false)}>
          <DietPlanForm
            isSubmitting={createDietPlan.isPending}
            error={createDietPlan.error}
            onCancel={() => setDietPlanOpen(false)}
            onSubmit={(input) =>
              createDietPlan.mutate(input, {
                onSuccess: (plan) =>
                  router.push(`/clients/${clientId}/diet-plans/${plan.id}`),
              })
            }
          />
        </Modal>
      )}

      {isEditOpen && (
        <Modal title="Editar cliente" onClose={() => setEditOpen(false)}>
          <ClientForm
            client={client}
            submitLabel="Guardar cambios"
            isSubmitting={updateClient.isPending}
            error={updateClient.error}
            onCancel={() => setEditOpen(false)}
            onSubmit={(input) =>
              updateClient.mutate(input, {
                onSuccess: () => setEditOpen(false),
              })
            }
          />
        </Modal>
      )}
    </>
  );
}
