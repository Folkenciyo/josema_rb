/** Geometry for the hand-rolled sparklines: weight, and now every body zone. */

export interface SeriesEntry {
  id: string;
  measured_on: string;
  value: number;
}

export interface SeriesPoint<T extends SeriesEntry = SeriesEntry> {
  x: number;
  y: number;
  entry: T;
}

export interface SeriesGeometry<T extends SeriesEntry = SeriesEntry> {
  points: SeriesPoint<T>[];
  path: string;
  min: number;
  max: number;
}

const CHART_PADDING = 4;

/**
 * Maps a series onto a viewBox of `width` x `height`, oldest on the left. The
 * input arrives newest first and is left untouched. A flat series is drawn
 * through the middle instead of dividing by zero, and a single point is no
 * chart at all.
 */
export function buildSeriesGeometry<T extends SeriesEntry>(
  entries: readonly T[],
  width: number,
  height: number,
): SeriesGeometry<T> | null {
  if (entries.length < 2) {
    return null;
  }

  const oldestFirst = [...entries].reverse();
  const values = oldestFirst.map((entry) => entry.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const usableHeight = height - CHART_PADDING * 2;

  const points = oldestFirst.map((entry, index) => ({
    x: (index / (oldestFirst.length - 1)) * width,
    y:
      span === 0
        ? height / 2
        : CHART_PADDING + ((max - entry.value) / span) * usableHeight,
    entry,
  }));

  return {
    points,
    path: points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
      .join(" "),
    min,
    max,
  };
}
