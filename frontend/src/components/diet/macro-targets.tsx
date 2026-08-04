"use client";

import { cn } from "@/lib/cn";
import {
  compareToTargets,
  type DailyTargets,
  type TargetStatus,
} from "@/lib/diet/macro-targets";
import type { MacroTotals } from "@/types/diet";

const BAR_COLORS: Record<TargetStatus, string> = {
  "on-target": "bg-emerald-500",
  under: "bg-amber-500",
  over: "bg-red-500",
};

const TEXT_COLORS: Record<TargetStatus, string> = {
  "on-target": "text-emerald-600",
  under: "text-amber-600",
  over: "text-red-600",
};

export function MacroTargets({
  totals,
  targets,
  className,
}: {
  totals: MacroTotals;
  targets: DailyTargets;
  className?: string;
}) {
  const comparisons = compareToTargets(totals, targets);

  if (comparisons.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {comparisons.map((comparison) => (
        <div key={comparison.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-slate-500">{comparison.label}</span>
            <span className="text-slate-700">
              <span className="font-semibold">{comparison.actual}</span>
              <span className="text-slate-400">
                {" "}
                / {comparison.target} {comparison.unit}
              </span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn("h-full rounded-full", BAR_COLORS[comparison.status])}
              style={{ width: `${comparison.percentage}%` }}
            />
          </div>
          <p className={cn("text-[11px]", TEXT_COLORS[comparison.status])}>
            {comparison.status === "on-target"
              ? "en objetivo"
              : comparison.status === "under"
                ? `faltan ${Math.abs(comparison.difference)} ${comparison.unit}`
                : `sobran ${comparison.difference} ${comparison.unit}`}
          </p>
        </div>
      ))}
    </div>
  );
}
