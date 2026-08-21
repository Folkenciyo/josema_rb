"use client";

import { useId } from "react";

import { formatDate } from "@/lib/format";
import { buildSeriesGeometry, type SeriesEntry } from "@/lib/measurements/chart";

const VIEWBOX_WIDTH = 300;
const VIEWBOX_HEIGHT = 80;

interface TrendChartProps {
  /** Newest first, the way the API serves them. */
  entries: readonly SeriesEntry[];
  /** What is being drawn, for the screen reader: "Evolución del peso". */
  label: string;
  format: (value: number) => string;
}

/** Hand-rolled SVG: a chart library would be a dependency for one sparkline. */
export function TrendChart({ entries, label, format }: TrendChartProps) {
  // Two charts on the same page would otherwise share one gradient id.
  const gradientId = useId();
  const geometry = buildSeriesGeometry(entries, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);

  if (!geometry) {
    return null;
  }

  const { points, path, min, max } = geometry;
  const areaPath = `${path} L${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT} L0 ${VIEWBOX_HEIGHT} Z`;

  return (
    <figure className="text-brand-600 px-5 py-4">
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}, de ${format(min)} a ${format(max)}`}
        className="h-20 w-full"
      >
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((point) => (
          <circle
            key={point.entry.id}
            cx={point.x}
            cy={point.y}
            r={2.5}
            fill="currentColor"
            vectorEffect="non-scaling-stroke"
          >
            <title>
              {`${formatDate(point.entry.measured_on)}: ${format(point.entry.value)}`}
            </title>
          </circle>
        ))}
        <defs>
          {/* currentColor so the fill follows the line instead of pinning a
              second brand colour into the file. */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{formatDate(points[0].entry.measured_on)}</span>
        <span>
          {format(min)} – {format(max)}
        </span>
        <span>{formatDate(points[points.length - 1].entry.measured_on)}</span>
      </figcaption>
    </figure>
  );
}
