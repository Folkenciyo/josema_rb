"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/feedback";
import { Spinner } from "@/components/ui/spinner";
import { useTrainingCalendar } from "@/hooks/use-workouts";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import {
  buildMonthGrid,
  firstDayOf,
  lastDayOf,
  monthLabel,
  monthOf,
  shiftMonth,
  todayIso,
  WEEKDAY_LABELS,
  type CalendarCell,
} from "@/lib/workout/calendar";
import type { TrainingCalendar } from "@/types/workout";
import { SessionDetail } from "./workouts-card";

function dayTitle(cell: CalendarCell): string {
  const when = formatDate(cell.date!);
  if (cell.entry?.trained) {
    const sets = cell.entry.set_count;
    return `${when}: entrenó${sets ? ` · ${sets} series` : ""}`;
  }
  if (cell.entry?.planned) {
    return cell.isFuture
      ? `${when}: le toca entrenar`
      : `${when}: le tocaba y no hay sesión`;
  }
  return when;
}

function Day({
  cell,
  isSelected,
  onSelect,
}: {
  cell: CalendarCell;
  isSelected: boolean;
  onSelect: () => void;
}) {
  if (cell.date === null) {
    return <span aria-hidden />;
  }

  const trained = cell.entry?.trained ?? false;
  // A planned day still to come is not a missed one; only the past is judged.
  const missed = (cell.entry?.planned ?? false) && !trained && !cell.isFuture;
  const upcoming = (cell.entry?.planned ?? false) && !trained && cell.isFuture;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!trained}
      title={dayTitle(cell)}
      aria-current={cell.isToday ? "date" : undefined}
      className={cn(
        "flex aspect-square items-center justify-center rounded-lg border text-sm transition-colors",
        trained
          ? "bg-brand-600 hover:bg-brand-700 border-transparent font-semibold text-white"
          : missed
            ? "border-dashed border-amber-400 text-amber-600"
            : upcoming
              ? "border-dashed border-slate-300 text-slate-400"
              : "border-transparent text-slate-400",
        cell.isToday && "ring-brand-400 ring-2",
        isSelected && "ring-2 ring-slate-900",
      )}
    >
      {cell.dayOfMonth}
    </button>
  );
}

function Summary({ calendar }: { calendar: TrainingCalendar }) {
  if (!calendar.has_active_plan) {
    return (
      <p className="text-sm text-slate-500">
        {calendar.trained_count === 0
          ? "Sin plan activo y sin sesiones este mes."
          : `${calendar.trained_count} días entrenados. Sin plan activo con el que compararlos.`}
      </p>
    );
  }

  if (calendar.plan_starts_on === null) {
    return (
      <p className="text-sm text-slate-500">
        {calendar.trained_count} días entrenados. Ponle fecha de inicio al plan y
        aquí verás también los días que le tocaba.
      </p>
    );
  }

  if (calendar.planned_count === 0) {
    return (
      <p className="text-sm text-slate-500">
        {calendar.trained_count} días entrenados. El plan no cubre este mes.
      </p>
    );
  }

  return (
    <p className="text-sm text-slate-600">
      <span className="font-semibold text-slate-900">
        {calendar.trained_count} de {calendar.planned_count}
      </span>{" "}
      días previstos
      {calendar.missed_count > 0 && (
        <span className="text-amber-600">
          {" "}
          · {calendar.missed_count} sin aparecer
        </span>
      )}
    </p>
  );
}

/** The month at a glance: what the client trained against what the plan asked. */
export function TrainingCalendarCard({ clientId }: { clientId: string }) {
  const [month, setMonth] = useState(() => monthOf(todayIso()));
  const [selected, setSelected] = useState<string | null>(null);

  const since = firstDayOf(month);
  const until = lastDayOf(month);
  const { data: calendar, isPending, error } = useTrainingCalendar(
    clientId,
    since,
    until,
  );

  const cells = buildMonthGrid(month, calendar?.days ?? []);
  const selectedEntry = calendar?.days.find((day) => day.date === selected);

  const nav = (
    <span className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setMonth(shiftMonth(month, -1))}
        aria-label="Mes anterior"
        className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-32 text-center text-sm font-medium text-slate-700 capitalize">
        {monthLabel(month)}
      </span>
      <button
        type="button"
        onClick={() => setMonth(shiftMonth(month, 1))}
        aria-label="Mes siguiente"
        className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      >
        <ChevronRight className="size-4" />
      </button>
    </span>
  );

  return (
    <Card>
      <CardHeader title="Calendario de entrenos" action={nav} />
      {error && <ErrorMessage error={error} />}

      <div className="px-5 py-4">
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="text-center text-xs font-medium text-slate-400"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, index) => (
            <Day
              key={cell.date ?? `empty-${index}`}
              cell={cell}
              isSelected={cell.date !== null && cell.date === selected}
              onSelect={() =>
                setSelected(cell.date === selected ? null : cell.date)
              }
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {isPending ? (
            <Spinner className="size-4" />
          ) : (
            calendar && <Summary calendar={calendar} />
          )}
          <span className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="bg-brand-600 size-3 rounded" />
              entrenó
            </span>
            <span className="flex items-center gap-1">
              <span className="size-3 rounded border border-dashed border-amber-400" />
              le tocaba
            </span>
          </span>
        </div>
      </div>

      {selectedEntry?.session_id && (
        <div className="border-t border-slate-100">
          <p className="px-5 pt-3 text-sm font-medium text-slate-800">
            {formatDate(selectedEntry.date)}
          </p>
          <SessionDetail
            clientId={clientId}
            sessionId={selectedEntry.session_id}
          />
        </div>
      )}
    </Card>
  );
}
