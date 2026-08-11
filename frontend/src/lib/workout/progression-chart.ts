import type { ExercisePoint } from "@/types/workout";

const PADDING = 6;

export interface ChartPoint {
  x: number;
  y: number;
  point: ExercisePoint;
}

export interface ProgressionGeometry {
  points: ChartPoint[];
  path: string;
  minWeight: number;
  maxWeight: number;
}

/**
 * The line is the heaviest set of each day. Days where nothing was loaded —
 * pull-ups, a stretch — have no weight to plot and are left out rather than
 * drawn as a drop to zero.
 */
export function buildProgressionGeometry(
  history: ExercisePoint[],
  width: number,
  height: number,
): ProgressionGeometry | null {
  const weighted = history.filter((point) => point.top_weight_kg !== null);
  if (weighted.length < 2) {
    return null;
  }

  const weights = weighted.map((point) => point.top_weight_kg as number);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const span = maxWeight - minWeight;
  const usableHeight = height - PADDING * 2;

  const points = weighted.map((point, index) => ({
    x: (index / (weighted.length - 1)) * width,
    y:
      span === 0
        ? height / 2
        : PADDING +
          ((maxWeight - (point.top_weight_kg as number)) / span) * usableHeight,
    point,
  }));

  return {
    points,
    path: points
      .map((item, index) => `${index === 0 ? "M" : "L"}${item.x} ${item.y}`)
      .join(" "),
    minWeight,
    maxWeight,
  };
}

/** How much the top set has moved since the first day on the chart. */
export function progressionDelta(history: ExercisePoint[]): number | null {
  const weights = history
    .map((point) => point.top_weight_kg)
    .filter((weight): weight is number => weight !== null);

  if (weights.length < 2) {
    return null;
  }
  return Math.round((weights[weights.length - 1] - weights[0]) * 100) / 100;
}
