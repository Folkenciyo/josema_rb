"use client";

import Link from "next/link";
import {
  CalendarClock,
  ClipboardList,
  RotateCcw,
  Scale,
  UserX,
} from "lucide-react";

import { useAlerts } from "@/hooks/use-alerts";
import { useReactivateClient } from "@/hooks/use-clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorMessage, LoadingState } from "@/components/ui/feedback";
import {
  describeExpiry,
  describeMissingPlans,
  describeStaleWeighIn,
  type AlertTone,
} from "@/lib/alerts/messages";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { PLAN_KIND_LABELS } from "@/types/alert";

const TONE_CLASSES: Record<AlertTone, string> = {
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

function AlertGroup({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="text-slate-400">{icon}</span>
        {title}
      </h3>
      <ul className="flex flex-col gap-1.5">{children}</ul>
    </section>
  );
}

function AlertRow({
  clientId,
  clientName,
  detail,
  tone,
  action,
}: {
  clientId: string;
  clientName: string;
  detail: string;
  tone?: AlertTone;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
      <Link href={`/clients/${clientId}`} className="min-w-0 flex-1">
        <span className="truncate font-medium text-slate-800">
          {clientName}
        </span>
        <span
          className={cn(
            "ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            tone ? TONE_CLASSES[tone] : "bg-slate-100 text-slate-600",
          )}
        >
          {detail}
        </span>
      </Link>
      {action}
    </li>
  );
}

export function AlertsPanel() {
  const { data: alerts, isPending, error } = useAlerts();
  const reactivateClient = useReactivateClient();

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (isPending) {
    return (
      <Card>
        <CardHeader title="Avisos" />
        <LoadingState label="Buscando avisos…" />
      </Card>
    );
  }

  if (alerts.total === 0) {
    return (
      <Card>
        <CardHeader title="Avisos" />
        <p className="px-5 py-6 text-center text-sm text-slate-500">
          Todo al día: nadie se ha quedado sin plan ni sin pesarse.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Avisos"
        action={<Badge className="bg-amber-100 text-amber-700">{alerts.total}</Badge>}
      />

      <div className="divide-y divide-slate-100">
        {alerts.clients_without_plan.length > 0 && (
          <AlertGroup
            icon={<ClipboardList className="size-4" />}
            title="Sin plan activo"
          >
            {alerts.clients_without_plan.map((alert) => (
              <AlertRow
                key={alert.client_id}
                clientId={alert.client_id}
                clientName={alert.client_name}
                detail={describeMissingPlans(alert.missing)}
                tone="warning"
              />
            ))}
          </AlertGroup>
        )}

        {alerts.expiring_plans.length > 0 && (
          <AlertGroup
            icon={<CalendarClock className="size-4" />}
            title="Planes que se acaban"
          >
            {alerts.expiring_plans.map((alert) => {
              const expiry = describeExpiry(alert.days_left);
              const kind = PLAN_KIND_LABELS[alert.plan_kind];
              return (
                <AlertRow
                  key={alert.plan_id}
                  clientId={alert.client_id}
                  clientName={`${alert.client_name} · ${kind}: ${alert.title}`}
                  detail={expiry.label}
                  tone={expiry.tone}
                />
              );
            })}
          </AlertGroup>
        )}

        {alerts.stale_weigh_ins.length > 0 && (
          <AlertGroup icon={<Scale className="size-4" />} title="Sin pesarse">
            {alerts.stale_weigh_ins.map((alert) => (
              <AlertRow
                key={alert.client_id}
                clientId={alert.client_id}
                clientName={alert.client_name}
                detail={describeStaleWeighIn(alert.days_since)}
                tone="warning"
              />
            ))}
          </AlertGroup>
        )}

        {alerts.inactive_clients.length > 0 && (
          <AlertGroup
            icon={<UserX className="size-4" />}
            title="Clientes inactivos"
          >
            {alerts.inactive_clients.map((alert) => (
              <AlertRow
                key={alert.client_id}
                clientId={alert.client_id}
                clientName={alert.client_name}
                detail={`Baja el ${formatDate(alert.deactivated_on)}`}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => reactivateClient.mutate(alert.client_id)}
                    loading={
                      reactivateClient.isPending &&
                      reactivateClient.variables === alert.client_id
                    }
                  >
                    <RotateCcw className="size-4" />
                    Reactivar
                  </Button>
                }
              />
            ))}
          </AlertGroup>
        )}
      </div>

      <ErrorMessage error={reactivateClient.error} />
    </Card>
  );
}
