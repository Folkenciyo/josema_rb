"use client";

import Link from "next/link";
import { ChevronRight, Dumbbell, Salad, Scale } from "lucide-react";

import { usePortalHome } from "@/hooks/use-portal";
import { Card } from "@/components/ui/card";
import { InstallCard } from "@/components/pwa/install-card";
import { formatDate } from "@/lib/format";
import { portalPath } from "@/types/portal";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "./portal-shell";

function SectionLink({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-4 px-5 py-4 hover:border-amber-300">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-800">{title}</span>
          <span className="block text-sm text-slate-500">{detail}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-slate-400" />
      </Card>
    </Link>
  );
}

export function PortalHomeView({ token }: { token: string }) {
  const { data: home, isPending, error } = usePortalHome(token);
  const base = portalPath(token);

  if (isPending) {
    return (
      <PortalPage>
        <PortalLoading />
      </PortalPage>
    );
  }

  if (error) {
    return (
      <PortalPage>
        <PortalNotice
          title="Este enlace ya no sirve"
          description="Puede que tu entrenador lo haya renovado. Pídele el nuevo y vuelve a entrar."
        />
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <PortalHeader title={`Hola, ${home.full_name.split(" ")[0]}`} />

      {home.goals && (
        <Card className="px-5 py-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-500">
            Tu objetivo
          </h2>
          <p className="text-slate-800">{home.goals}</p>
        </Card>
      )}

      <SectionLink
        href={`${base}/rutina`}
        icon={<Dumbbell className="size-5" />}
        title="Mi rutina"
        detail={
          home.has_training_plan
            ? "Tu entrenamiento de esta etapa"
            : "Todavía sin publicar"
        }
      />
      <SectionLink
        href={`${base}/dieta`}
        icon={<Salad className="size-5" />}
        title="Mi dieta"
        detail={
          home.has_diet_plan ? "Tus menús del día" : "Todavía sin publicar"
        }
      />
      <SectionLink
        href={`${base}/peso`}
        icon={<Scale className="size-5" />}
        title="Mi peso"
        detail={
          home.latest_weight_kg !== null && home.latest_weighed_on
            ? `${home.latest_weight_kg} kg · ${formatDate(home.latest_weighed_on)}`
            : "Todavía sin pesajes"
        }
      />

      <InstallCard
        title="Tenlo siempre a mano"
        description="Añádelo a la pantalla de inicio de tu móvil y podrás consultar tu rutina y tu dieta aunque te quedes sin cobertura."
      />
    </PortalPage>
  );
}
