import type { Measurement } from "@/types/measurement";

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

export interface WeightProgress {
  latest: Measurement | null;
  /** Kilos gained (positive) or lost (negative) since the previous weigh-in. */
  sincePrevious: number | null;
  /** Kilos gained or lost since the very first weigh-in on record. */
  sinceStart: number | null;
}

/**
 * Measurements arrive newest first from the API; nothing here reorders or
 * mutates the input.
 */
export function summarizeProgress(measurements: Measurement[]): WeightProgress {
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

export interface ChartPoint {
  x: number;
  y: number;
  measurement: Measurement;
}

export interface ChartGeometry {
  points: ChartPoint[];
  path: string;
  minWeight: number;
  maxWeight: number;
}

const CHART_PADDING = 4;

/**
 * Maps weigh-ins onto a viewBox of `width` x `height`, oldest on the left.
 * A flat series is drawn through the middle instead of dividing by zero.
 */
export function buildChartGeometry(
  measurements: Measurement[],
  width: number,
  height: number,
): ChartGeometry | null {
  if (measurements.length < 2) {
    return null;
  }

  const oldestFirst = [...measurements].reverse();
  const weights = oldestFirst.map((m) => m.weight_kg);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const span = maxWeight - minWeight;
  const usableHeight = height - CHART_PADDING * 2;

  const points = oldestFirst.map((measurement, index) => ({
    x: (index / (oldestFirst.length - 1)) * width,
    y:
      span === 0
        ? height / 2
        : CHART_PADDING +
          ((maxWeight - measurement.weight_kg) / span) * usableHeight,
    measurement,
  }));

  return {
    points,
    path: points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
      .join(" "),
    minWeight,
    maxWeight,
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
