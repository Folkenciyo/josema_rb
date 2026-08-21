"use client";

import {
  usePortalBodyMeasurements,
  usePortalMeasurements,
} from "@/hooks/use-portal";
import { WeightChart } from "@/components/clients/weight-chart";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { formatWeight, summarizeProgress } from "@/lib/measurements/progress";
import { PortalBodyForm } from "./portal-body-form";
import { PortalBodyProgress } from "./portal-body-progress";
import { PortalWeighInForm } from "./portal-weigh-in-form";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "./portal-shell";

/** Local ISO day: `toISOString()` would jump to the previous day west of UTC. */
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function DeltaLabel({ kilos }: { kilos: number | null }) {
  if (kilos === null || kilos === 0) {
    return <span className="text-slate-400">sin cambio</span>;
  }

  const isDown = kilos < 0;
  return (
    <span className={isDown ? "text-emerald-600" : "text-brand-600"}>
      {isDown ? "−" : "+"}
      {formatWeight(Math.abs(kilos))}
    </span>
  );
}

export function PortalWeightView({ token }: { token: string }) {
  const { data: measurements, isPending, error } = usePortalMeasurements(token);
  const bodyMeasurements = usePortalBodyMeasurements(token);

  if (isPending || bodyMeasurements.isPending) {
    return (
      <PortalPage>
        <PortalLoading />
      </PortalPage>
    );
  }

  if (error) {
    return (
      <PortalPage>
        <PortalHeader title="Mi cuerpo" />
        <PortalNotice
          title="Este enlace ya no sirve"
          description="Pídele a tu entrenador el enlace nuevo y vuelve a entrar."
        />
      </PortalPage>
    );
  }

  const progress = summarizeProgress(measurements);
  const today = todayIso();
  const entryToday =
    measurements.find((entry) => entry.measured_on === today) ?? null;
  const readings = bodyMeasurements.data ?? [];
  const bodyToday =
    readings.find((entry) => entry.measured_on === today) ?? null;

  return (
    <PortalPage>
      <PortalHeader title="Mi cuerpo" />

      <PortalWeighInForm
        token={token}
        weighedToday={entryToday?.weight_kg ?? null}
        notesToday={entryToday?.notes ?? null}
      />

      {measurements.length === 0 ? (
        <PortalNotice
          title="Todavía sin pesajes"
          description="Apunta el primero aquí arriba y empezarás a ver tu evolución."
        />
      ) : (
        <>
          <Card>
            <div className="px-5 pt-4">
              <p className="text-3xl font-bold text-slate-900">
                {progress.latest
                  ? formatWeight(progress.latest.weight_kg)
                  : "—"}
              </p>
              <p className="text-sm text-slate-500">
                {progress.latest && formatDate(progress.latest.measured_on)}
                {progress.latest?.bmi != null &&
                  ` · IMC ${progress.latest.bmi}`}
              </p>
              <p className="mt-1 text-sm">
                Desde el principio: <DeltaLabel kilos={progress.sinceStart} />
              </p>
            </div>
            <WeightChart measurements={measurements} />
          </Card>

          <Card>
            <h2 className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">
              Historial
            </h2>
            <ul className="divide-y divide-slate-100">
              {measurements.map((measurement) => (
                <li key={measurement.id} className="px-4 py-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                      {formatDate(measurement.measured_on)}
                    </span>
                    <span className="font-medium text-slate-800">
                      {formatWeight(measurement.weight_kg)}
                    </span>
                  </div>
                  {measurement.notes && (
                    <p className="mt-0.5 text-xs whitespace-pre-line text-slate-500">
                      {measurement.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <PortalBodyForm token={token} today={bodyToday} />
      <PortalBodyProgress readings={readings} />
    </PortalPage>
  );
}
