"use client";

import { Copy, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface WeekTabsProps {
  weeks: { id: string; week_number: number }[];
  activeWeekId: string | null;
  onSelect: (weekId: string) => void;
  onAddWeek: () => void;
  onDuplicateWeek: () => void;
  isBusy: boolean;
}

export function WeekTabs({
  weeks,
  activeWeekId,
  onSelect,
  onAddWeek,
  onDuplicateWeek,
  isBusy,
}: WeekTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
      <div role="tablist" className="flex flex-wrap gap-1">
        {weeks.map((week) => (
          <button
            key={week.id}
            role="tab"
            type="button"
            aria-selected={week.id === activeWeekId}
            onClick={() => onSelect(week.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
              week.id === activeWeekId
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            Semana {week.week_number}
          </button>
        ))}
      </div>

      <div className="ml-auto flex gap-2">
        {activeWeekId && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onDuplicateWeek}
            loading={isBusy}
          >
            <Copy className="size-4" />
            Duplicar
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={onAddWeek} loading={isBusy}>
          <Plus className="size-4" />
          Añadir semana
        </Button>
      </div>
    </div>
  );
}
