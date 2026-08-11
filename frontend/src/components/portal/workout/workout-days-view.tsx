"use client";

import Link from "next/link";
import { CloudUpload, Dumbbell, History, Play } from "lucide-react";

import {
  usePortalWorkouts,
  useWorkoutDays,
  useWorkoutState,
  useWorkoutSync,
} from "@/hooks/use-workouts";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { portalPath } from "@/types/portal";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "../portal-shell";

function PendingNotice({ token }: { token: string }) {
  const { pendingCount, isSending, rejected, dismissRejected } =
    useWorkoutSync(token);

  if (rejected) {
    return (
      <Card className="border-red-200 bg-red-50 px-5 py-4">
        <p className="font-semibold text-red-800">
          Una sesión no se ha podido guardar
        </p>
        <p className="mt-1 text-sm text-red-700">{rejected}</p>
        <button
          type="button"
          onClick={dismissRejected}
          className="mt-2 text-sm font-medium text-red-700 underline"
        >
          Entendido
        </button>
      </Card>
    );
  }

  if (pendingCount === 0) {
    return null;
  }

  return (
    <Card className="flex items-center gap-3 border-amber-200 bg-amber-50 px-5 py-4">
      <CloudUpload className="size-5 shrink-0 text-amber-600" />
      <p className="text-sm text-amber-900">
        {pendingCount === 1
          ? "Tienes una sesión guardada en el móvil"
          : `Tienes ${pendingCount} sesiones guardadas en el móvil`}
        {isSending
          ? ", enviándola…"
          : ". Se enviará sola en cuanto haya cobertura."}
      </p>
    </Card>
  );
}

export function WorkoutDaysView({ token }: { token: string }) {
  const { data: days, isPending, error } = useWorkoutDays(token);
  const { data: sessions } = usePortalWorkouts(token);
  const { draft } = useWorkoutState();
  const base = portalPath(token);

  if (isPending) {
    return (
      <PortalPage>
        <PortalLoading />
      </PortalPage>
    );
  }

  if (error || !days) {
    return (
      <PortalPage>
        <PortalNotice
          title="Todavía no hay rutina que entrenar"
          description="En cuanto tu entrenador publique tu plan, podrás ir apuntando aquí los pesos de cada sesión."
        />
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <PortalHeader
        title="Entreno"
        subtitle="Elige el día y apunta tus pesos"
      />

      <PendingNotice token={token} />

      {days.map((day) => {
        const isOpen = draft?.dayId === day.id;

        return (
          <Link key={day.id} href={`${base}/entreno/${day.id}`}>
            <Card className="flex items-center gap-4 px-5 py-4 hover:border-amber-300">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                {isOpen ? (
                  <Play className="size-5" />
                ) : (
                  <Dumbbell className="size-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-800">
                  {day.day_of_week_es}
                </span>
                <span className="block text-sm text-slate-500">
                  {day.exercise_count === 0
                    ? "Descanso"
                    : `${day.exercise_count} ejercicios`}
                  {day.last_performed_on
                    ? ` · última vez ${formatDate(day.last_performed_on)}`
                    : ""}
                </span>
              </span>
              {isOpen && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Sin terminar
                </span>
              )}
            </Card>
          </Link>
        );
      })}

      {sessions && sessions.length > 0 && (
        <Card className="mt-2">
          <h2 className="flex items-center gap-2 border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 uppercase">
            <History className="size-4" />
            Lo que llevas hecho
          </h2>
          <ul className="divide-y divide-slate-100">
            {sessions.slice(0, 10).map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <span>
                  <span className="block font-medium text-slate-800">
                    {session.day_of_week_es}
                  </span>
                  <span className="block text-sm text-slate-500">
                    {formatDate(session.performed_on)} · {session.set_count}{" "}
                    series
                  </span>
                </span>
                <span className="text-sm font-semibold text-slate-600">
                  {session.total_volume_kg} kg
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PortalPage>
  );
}
