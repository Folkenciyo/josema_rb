"use client";

import { useState } from "react";

import { TrendChart } from "@/components/clients/trend-chart";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import {
  BODY_ZONE_LABELS,
  formatCentimetreDelta,
  formatCentimetres,
  measuredZones,
  summarizeZone,
  zoneSeries,
} from "@/lib/measurements/body";
import type { BodyReading, BodyZoneKey } from "@/types/measurement";

/** The client's own tape history: one zone at a time, newest first. */
export function PortalBodyProgress({ readings }: { readings: BodyReading[] }) {
  const [pickedZone, setPickedZone] = useState<BodyZoneKey | null>(null);

  const zones = measuredZones(readings);
  const zone = pickedZone && zones.includes(pickedZone) ? pickedZone : zones[0];

  if (!zone) {
    return null;
  }

  const progress = summarizeZone(readings, zone);
  const series = zoneSeries(readings, zone);

  return (
    <Card>
      <div className="flex flex-wrap gap-1.5 px-5 pt-4">
        {zones.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPickedZone(key)}
            aria-pressed={key === zone}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              key === zone
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600",
            )}
          >
            {BODY_ZONE_LABELS[key]}
          </button>
        ))}
      </div>

      {progress.latest && (
        <div className="px-5 pt-3">
          <p className="text-3xl font-bold text-slate-900">
            {formatCentimetres(progress.latest.value)}
          </p>
          <p className="text-sm text-slate-500">
            {BODY_ZONE_LABELS[zone]} · {formatDate(progress.latest.measured_on)}
          </p>
          {progress.sinceStart !== null && (
            <p className="mt-1 text-sm text-slate-500">
              Desde el principio:{" "}
              {/* Neutral on purpose: on the waist down is progress, on the arm
                  it is the opposite, and the app does not pick a side. */}
              <span className="font-semibold text-slate-700">
                {formatCentimetreDelta(progress.sinceStart)}
              </span>
            </p>
          )}
        </div>
      )}

      <TrendChart
        entries={series}
        label={`Evolución de ${BODY_ZONE_LABELS[zone].toLowerCase()}`}
        format={formatCentimetres}
      />

      <ul className="divide-y divide-slate-100 border-t border-slate-100">
        {series.map((point) => (
          <li
            key={point.id}
            className="flex items-center justify-between px-5 py-2.5 text-sm"
          >
            <span className="text-slate-500">
              {formatDate(point.measured_on)}
            </span>
            <span className="font-medium text-slate-800">
              {formatCentimetres(point.value)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
