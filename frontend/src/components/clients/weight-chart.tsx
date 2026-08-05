"use client";

import { buildChartGeometry, formatWeight } from "@/lib/measurements/progress";
import { formatDate } from "@/lib/format";
import type { Measurement } from "@/types/measurement";

const VIEWBOX_WIDTH = 300;
const VIEWBOX_HEIGHT = 80;

/** Hand-rolled SVG: a chart library would be a dependency for one sparkline. */
export function WeightChart({ measurements }: { measurements: Measurement[] }) {
  const geometry = buildChartGeometry(
    measurements,
    VIEWBOX_WIDTH,
    VIEWBOX_HEIGHT,
  );

  if (!geometry) {
    return null;
  }

  const { points, path, minWeight, maxWeight } = geometry;
  const areaPath = `${path} L${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT} L0 ${VIEWBOX_HEIGHT} Z`;

  return (
    <figure className="px-5 py-4">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Evolución del peso, de ${formatWeight(minWeight)} a ${formatWeight(maxWeight)}`}
        className="h-20 w-full"
      >
        <path d={areaPath} fill="url(#weight-gradient)" />
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="text-amber-500"
        />
        {points.map((point) => (
          <circle
            key={point.measurement.id}
            cx={point.x}
            cy={point.y}
            r={2.5}
            className="fill-amber-600"
            vectorEffect="non-scaling-stroke"
          >
            <title>
              {`${formatDate(point.measurement.measured_on)}: ${formatWeight(point.measurement.weight_kg)}`}
            </title>
          </circle>
        ))}
        <defs>
          <linearGradient id="weight-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(245 158 11)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="rgb(245 158 11)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{formatDate(points[0].measurement.measured_on)}</span>
        <span>
          {formatWeight(minWeight)} – {formatWeight(maxWeight)}
        </span>
        <span>
          {formatDate(points[points.length - 1].measurement.measured_on)}
        </span>
      </figcaption>
    </figure>
  );
}
