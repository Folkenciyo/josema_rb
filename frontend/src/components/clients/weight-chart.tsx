"use client";

import { formatWeight } from "@/lib/measurements/progress";
import type { WeighIn } from "@/types/measurement";
import { TrendChart } from "./trend-chart";

export function WeightChart({ measurements }: { measurements: WeighIn[] }) {
  return (
    <TrendChart
      entries={measurements.map((measurement) => ({
        id: measurement.id,
        measured_on: measurement.measured_on,
        value: measurement.weight_kg,
      }))}
      label="Evolución del peso"
      format={formatWeight}
    />
  );
}
