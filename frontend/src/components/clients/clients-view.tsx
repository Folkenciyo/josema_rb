"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Search } from "lucide-react";

import { useClients, useCreateClient } from "@/hooks/use-clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import type { Client } from "@/types/client";
import { ClientForm } from "./client-form";

function matchesSearch(client: Client, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (needle === "") {
    return true;
  }

  return (
    client.full_name.toLowerCase().includes(needle) ||
    (client.email ?? "").toLowerCase().includes(needle)
  );
}

export function ClientsView() {
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const { data: clients, isPending, error } = useClients(includeInactive);
  const createClient = useCreateClient();

  const visibleClients = useMemo(
    () => (clients ?? []).filter((client) => matchesSearch(client, search)),
    [clients, search],
  );

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Cada cliente guarda todo su historial de planes."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo cliente
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o email"
            className="pl-9"
            aria-label="Buscar clientes"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
            className="accent-brand-600 size-4"
          />
          Mostrar inactivos
        </label>
      </div>

      {error && <ErrorMessage error={error} />}

      <Card>
        {isPending ? (
          <LoadingState />
        ) : visibleClients.length === 0 ? (
          <EmptyState
            title={
              clients?.length === 0
                ? "Todavía no tienes clientes"
                : "Ningún cliente coincide con la búsqueda"
            }
            description={
              clients?.length === 0
                ? "Crea el primero para empezar a construir sus planes."
                : undefined
            }
            action={
              clients?.length === 0 ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" />
                  Nuevo cliente
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleClients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium text-slate-800">
                      <span className="truncate">{client.full_name}</span>
                      {!client.active && <Badge>Inactivo</Badge>}
                    </p>
                    {client.email && (
                      <p className="truncate text-sm text-slate-500">
                        {client.email}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isCreateOpen && (
        <Modal title="Nuevo cliente" onClose={() => setCreateOpen(false)}>
          <ClientForm
            submitLabel="Crear cliente"
            isSubmitting={createClient.isPending}
            error={createClient.error}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(input) =>
              createClient.mutate(input, {
                onSuccess: () => setCreateOpen(false),
              })
            }
          />
        </Modal>
      )}
    </>
  );
}
