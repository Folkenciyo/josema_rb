import { buildSeriesGeometry } from "./chart";
import type { WeighIn } from "@/types/measurement";

export type BmiCategory =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese";

export const BMI_CATEGORY_LABELS: Record<BmiCategory, string> = {
  underweight: "Bajo peso",
  normal: "Normopeso",
  overweight: "Sobrepeso",
  obese: "Obesidad",
};

/** WHO cut-offs. The BMI ignores muscle mass, so it is a hint, not a verdict. */
export function bmiCategory(bmi: number | null): BmiCategory | null {
  if (bmi === null) {
    return null;
  }
  if (bmi < 18.5) {
    return "underweight";
  }
  if (bmi < 25) {
    return "normal";
  }
  if (bmi < 30) {
    return "overweight";
  }
  return "obese";
}

export interface WeightProgress<T extends WeighIn = WeighIn> {
  latest: T | null;
  /** Kilos gained (positive) or lost (negative) since the previous weigh-in. */
  sincePrevious: number | null;
  /** Kilos gained or lost since the very first weigh-in on record. */
  sinceStart: number | null;
}

/**
 * Measurements arrive newest first from the API; nothing here reorders or
 * mutates the input.
 */
export function summarizeProgress<T extends WeighIn>(
  measurements: T[],
): WeightProgress<T> {
  const [latest, previous] = measurements;
  const first = measurements[measurements.length - 1];

  if (!latest) {
    return { latest: null, sincePrevious: null, sinceStart: null };
  }

  return {
    latest,
    sincePrevious: previous ? round(latest.weight_kg - previous.weight_kg) : null,
    sinceStart:
      first && first.id !== latest.id
        ? round(latest.weight_kg - first.weight_kg)
        : null,
  };
}

export interface ChartPoint<T extends WeighIn = WeighIn> {
  x: number;
  y: number;
  measurement: T;
}

export interface ChartGeometry<T extends WeighIn = WeighIn> {
  points: ChartPoint<T>[];
  path: string;
  minWeight: number;
  maxWeight: number;
}

/**
 * Maps weigh-ins onto a viewBox of `width` x `height`, oldest on the left.
 * The maths lives in `buildSeriesGeometry`, shared with the body zone charts;
 * this only speaks in kilos.
 */
export function buildChartGeometry<T extends WeighIn>(
  measurements: T[],
  width: number,
  height: number,
): ChartGeometry<T> | null {
  const geometry = buildSeriesGeometry(
    measurements.map((measurement) => ({
      ...measurement,
      value: measurement.weight_kg,
    })),
    width,
    height,
  );

  if (!geometry) {
    return null;
  }

  return {
    points: geometry.points.map(({ x, y, entry }) => ({
      x,
      y,
      measurement: entry,
    })),
    path: geometry.path,
    minWeight: geometry.min,
    maxWeight: geometry.max,
  };
}

export function formatWeight(weightKg: number): string {
  return `${weightKg.toFixed(1).replace(".", ",")} kg`;
}

/** Signed so the UI can show "+1,2 kg" without rebuilding the string. */
export function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${Math.abs(delta).toFixed(1).replace(".", ",")} kg`;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
