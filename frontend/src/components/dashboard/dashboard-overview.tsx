"use client";

import Link from "next/link";
import { ArrowRight, UserPlus, Users } from "lucide-react";

import { useClients } from "@/hooks/use-clients";
import { useCurrentTrainer } from "@/hooks/use-auth";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";

const MAX_RECENT_CLIENTS = 5;

export function DashboardOverview() {
  const { data: trainer } = useCurrentTrainer();
  const { data: clients, isPending, error } = useClients();

  const greeting = trainer?.full_name ?? "entrenador";

  return (
    <>
      <PageHeader
        title={`Hola, ${greeting}`}
        description="Resumen de tu actividad."
      />

      {error && <ErrorMessage error={error} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-11 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
            <Users className="size-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {isPending ? "—" : clients?.length}
            </p>
            <p className="text-sm text-slate-500">Clientes activos</p>
          </div>
        </Card>

        <Link
          href="/clients"
          className="flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-slate-600 transition-colors hover:border-amber-400 hover:text-slate-900"
        >
          <span className="flex size-11 items-center justify-center rounded-lg bg-slate-100">
            <UserPlus className="size-5" />
          </span>
          <span className="text-sm font-semibold">Gestionar clientes</span>
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Clientes recientes"
          action={
            <Link
              href="/clients"
              className="flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Ver todos <ArrowRight className="size-4" />
            </Link>
          }
        />
        {isPending ? (
          <LoadingState />
        ) : clients && clients.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {clients.slice(0, MAX_RECENT_CLIENTS).map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-800">
                    {client.full_name}
                  </span>
                  <ArrowRight className="size-4 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Todavía no tienes clientes"
            description="Crea tu primer cliente para empezar a construir sus planes."
          />
        )}
      </Card>
    </>
  );
}
