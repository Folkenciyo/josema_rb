"use client";

import Link from "next/link";
import {
  Camera,
  ChevronRight,
  Dumbbell,
  Play,
  Salad,
  Scale,
  TrendingUp,
} from "lucide-react";

import { usePortalHome } from "@/hooks/use-portal";
import { useWorkoutDays } from "@/hooks/use-workouts";
import { todaysWorkout } from "@/lib/portal/today";
import { Card } from "@/components/ui/card";
import { InstallCard } from "@/components/pwa/install-card";
import { PortalQuoteCard } from "./portal-quote-card";
import { formatDate } from "@/lib/format";
import { portalPath } from "@/types/portal";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "./portal-shell";

/**
 * What the day asks for, before anything else: the session that is due, one
 * tap from starting it. On a rest day it says so, and which day comes next.
 */
function TodayCard({ token, base }: { token: string; base: string }) {
  const { data: days } = useWorkoutDays(token);
  const due = days ? todaysWorkout(days, new Date()) : null;
  if (!due) return null;

  return (
    <Link href={`${base}/entreno/${due.day.id}`}>
      <Card className="border-brand-200 bg-brand-50 hover:border-brand-300 flex items-center gap-4 px-5 py-4">
        <span className="bg-brand-600 flex size-11 shrink-0 items-center justify-center rounded-lg text-white">
          <Play className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-brand-800 block text-sm font-semibold">
            {due.isToday ? "Hoy toca" : "Hoy descansas · el próximo"}
          </span>
          <span className="block font-semibold text-slate-800">
            {due.day.day_of_week_es} · {due.day.exercise_count} ejercicios
          </span>
          <span className="block text-sm text-slate-500">
            {due.isToday ? "Empieza y apunta tus pesos" : "Ábrelo para verlo"}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-slate-400" />
      </Card>
    </Link>
  );
}

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
      <Card className="hover:border-brand-300 flex items-center gap-4 px-5 py-4">
        <span className="bg-brand-100 text-brand-600 flex size-11 shrink-0 items-center justify-center rounded-lg">
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

      {home.has_training_plan && <TodayCard token={token} base={base} />}

      {home.quote && <PortalQuoteCard quote={home.quote} />}

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

      {/* Both only when there is something behind them: an empty screen the
          client cannot fill is worse than no link at all. */}
      {home.workout_count > 0 && (
        <SectionLink
          href={`${base}/progreso`}
          icon={<TrendingUp className="size-5" />}
          title="Mi progreso"
          detail={`${home.workout_count} ${home.workout_count === 1 ? "sesión apuntada" : "sesiones apuntadas"}`}
        />
      )}
      {home.photo_consent_at !== null && home.photo_count > 0 && (
        <SectionLink
          href={`${base}/fotos`}
          icon={<Camera className="size-5" />}
          title="Mis fotos"
          detail={`${home.photo_count} ${home.photo_count === 1 ? "foto guardada" : "fotos guardadas"}`}
        />
      )}

      <InstallCard
        title="Tenlo siempre a mano"
        description="Añádelo a la pantalla de inicio de tu móvil y podrás consultar tu rutina y tu dieta aunque te quedes sin cobertura."
      />
    </PortalPage>
  );
}
