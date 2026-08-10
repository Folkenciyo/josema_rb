"use client";

import { useState } from "react";

import { usePortalDietPlan } from "@/hooks/use-portal";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { MacroTotals } from "@/types/diet";
import type { PortalDietDay } from "@/types/portal";
import { PortalDownloads } from "./portal-downloads";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "./portal-shell";

function macroLine(totals: MacroTotals): string {
  return [
    `${Math.round(totals.calories)} kcal`,
    `P ${Math.round(totals.protein_g)} g`,
    `HC ${Math.round(totals.carbs_g)} g`,
    `G ${Math.round(totals.fat_g)} g`,
  ].join(" · ");
}

function DayCard({ day }: { day: PortalDietDay }) {
  return (
    <Card>
      <div className="border-b border-slate-200 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-700">
          {day.day_of_week_es}
        </h2>
        {day.totals && (
          <p className="text-xs text-slate-500">{macroLine(day.totals)}</p>
        )}
      </div>

      {day.meals.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-500">Día libre</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {day.meals.map((meal, index) => (
            <li key={`${meal.name}-${index}`} className="px-4 py-3">
              <p className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-slate-800">{meal.name}</span>
                {meal.time_of_day && (
                  <span className="text-xs text-slate-400">
                    {meal.time_of_day}
                  </span>
                )}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {meal.items.map((item, itemIndex) => (
                  <li
                    key={`${item.food_name}-${itemIndex}`}
                    className="flex justify-between gap-3 text-sm text-slate-600"
                  >
                    <span>{item.food_name}</span>
                    <span className="shrink-0 text-slate-400">
                      {item.quantity_label ?? ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-slate-400">
                {macroLine(meal.totals)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function PortalDietView({ token }: { token: string }) {
  const { data: plan, isPending, error } = usePortalDietPlan(token);
  const [weekIndex, setWeekIndex] = useState(0);

  if (isPending) {
    return (
      <PortalPage>
        <PortalLoading />
      </PortalPage>
    );
  }

  if (error) {
    return (
      <PortalPage>
        <PortalHeader title="Mi dieta" />
        <PortalNotice
          title="Todavía no hay dieta"
          description="En cuanto tu entrenador publique tus menús los verás aquí."
        />
      </PortalPage>
    );
  }

  const week = plan.weeks[weekIndex] ?? plan.weeks[0];

  return (
    <PortalPage>
      <PortalHeader title="Mi dieta" subtitle={plan.plan_title} />

      {plan.daily_calories_target && (
        <Card className="px-4 py-3">
          <p className="text-sm text-slate-500">Objetivo diario</p>
          <p className="font-semibold text-slate-800">
            {Math.round(plan.daily_calories_target)} kcal
            {plan.daily_protein_g
              ? ` · ${Math.round(plan.daily_protein_g)} g de proteína`
              : ""}
          </p>
        </Card>
      )}

      {plan.weeks.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {plan.weeks.map((candidate, index) => (
            <button
              key={candidate.week_number}
              onClick={() => setWeekIndex(index)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold",
                index === weekIndex
                  ? "bg-amber-500 text-slate-900"
                  : "border border-slate-300 bg-white text-slate-600",
              )}
            >
              Semana {candidate.week_number}
            </button>
          ))}
        </div>
      )}

      {week?.days.map((day) => (
        <DayCard key={day.day_of_week_es} day={day} />
      ))}

      <PortalDownloads token={token} plan="diet-plan" />
    </PortalPage>
  );
}
