"use client";

import { Scale } from "lucide-react";

import { usePortalHome } from "@/hooks/use-portal";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/format";

function InvalidLink() {
  return (
    <Card className="p-6 text-center">
      <p className="font-semibold text-slate-800">Este enlace ya no sirve</p>
      <p className="mt-2 text-sm text-slate-500">
        Puede que tu entrenador lo haya renovado. Pídele el nuevo y vuelve a
        entrar.
      </p>
    </Card>
  );
}

export function PortalHomeView({ token }: { token: string }) {
  const { data: home, isPending, error } = usePortalHome(token);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
      <header>
        <p className="text-xs font-semibold tracking-widest text-amber-600 uppercase">
          JOSEMA RB
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          {home ? `Hola, ${home.full_name.split(" ")[0]}` : "Tu seguimiento"}
        </h1>
      </header>

      {isPending ? (
        <LoadingState />
      ) : error ? (
        <InvalidLink />
      ) : (
        <>
          {home.goals && (
            <Card className="px-5 py-4">
              <h2 className="mb-1 text-sm font-semibold text-slate-500">
                Tu objetivo
              </h2>
              <p className="text-slate-800">{home.goals}</p>
            </Card>
          )}

          <Card className="flex items-center gap-4 px-5 py-4">
            <span className="flex size-11 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Scale className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {home.latest_weight_kg !== null
                  ? `${home.latest_weight_kg} kg`
                  : "—"}
              </p>
              <p className="text-sm text-slate-500">
                {home.latest_weighed_on
                  ? `Último pesaje: ${formatDate(home.latest_weighed_on)}`
                  : "Todavía sin pesajes"}
              </p>
            </div>
          </Card>

          <p className="px-1 text-center text-sm text-slate-400">
            Tu rutina y tu dieta aparecerán aquí en cuanto tu entrenador las
            publique.
          </p>
        </>
      )}
    </main>
  );
}
