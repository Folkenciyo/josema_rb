"use client";

import { useState } from "react";

import { usePortalDietPlan } from "@/hooks/use-portal";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { PortalDietDay } from "@/types/portal";
import { PortalDownloads } from "./portal-downloads";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "./portal-shell";

function macroLine(totals: {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}): string {
  return [
    `${Math.round(totals.calories ?? 0)} kcal`,
    `P ${Math.round(totals.protein_g ?? 0)} g`,
    `HC ${Math.round(totals.carbs_g ?? 0)} g`,
    `G ${Math.round(totals.fat_g ?? 0)} g`,
  ].join(" · ");
}

/** Consecutive items sharing an alternative_group, kept together for display. */
function groupMealItems(
  items: PortalDietDay["meals"][number]["items"],
): (typeof items)[number][][] {
  const groups: (typeof items)[number][][] = [];
  const indexByGroup = new Map<string, number>();

  for (const item of items) {
    if (item.alternative_group && indexByGroup.has(item.alternative_group)) {
      groups[indexByGroup.get(item.alternative_group)!].push(item);
      continue;
    }
    if (item.alternative_group) {
      indexByGroup.set(item.alternative_group, groups.length);
    }
    groups.push([item]);
  }

  return groups;
}

/** Same rule one level up: meals sharing an alternative_group are alternative
 * full meals for the same slot, kept together for display. */
function groupDayMeals(
  meals: PortalDietDay["meals"],
): (typeof meals)[number][][] {
  const groups: (typeof meals)[number][][] = [];
  const indexByGroup = new Map<string, number>();

  for (const meal of meals) {
    if (meal.alternative_group && indexByGroup.has(meal.alternative_group)) {
      groups[indexByGroup.get(meal.alternative_group)!].push(meal);
      continue;
    }
    if (meal.alternative_group) {
      indexByGroup.set(meal.alternative_group, groups.length);
    }
    groups.push([meal]);
  }

  return groups;
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
          {groupDayMeals(day.meals).map((group, groupIndex) => {
            const [primary, ...alternatives] = group;
            return (
              <li key={`${primary.name}-${groupIndex}`} className="px-4 py-3">
                <p className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-slate-800">
                    {primary.name}
                  </span>
                  {primary.time_of_day && (
                    <span className="text-xs text-slate-400">
                      {primary.time_of_day}
                    </span>
                  )}
                </p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {groupMealItems(primary.items).map((itemGroup, itemGroupIndex) => {
                    const [primaryItem, ...itemAlternatives] = itemGroup;
                    return (
                      <li key={`${primaryItem.food_name}-${itemGroupIndex}`}>
                        <div className="flex justify-between gap-3 text-sm text-slate-600">
                          <span>{primaryItem.food_name}</span>
                          <span className="shrink-0 text-slate-400">
                            {primaryItem.quantity_label ?? ""}
                          </span>
                        </div>
                        {itemAlternatives.map((alternative, altIndex) => (
                          <div
                            key={`${alternative.food_name}-${altIndex}`}
                            className="mt-0.5 pl-3 text-xs text-slate-400"
                          >
                            <span>
                              o bien: {alternative.food_name}
                              {alternative.quantity_label
                                ? ` (${alternative.quantity_label})`
                                : ""}
                            </span>
                            <span className="ml-2">
                              {macroLine(alternative)}
                            </span>
                          </div>
                        ))}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-1 text-xs text-slate-400">
                  {macroLine(primary.totals)}
                </p>
                {alternatives.map((alternative, altIndex) => (
                  <div
                    key={`${alternative.name}-${altIndex}`}
                    className="mt-2 border-t border-dashed border-slate-200 pt-2"
                  >
                    <p className="text-xs font-medium text-slate-400">
                      o bien: {alternative.name}
                      {alternative.time_of_day
                        ? ` (${alternative.time_of_day})`
                        : ""}
                    </p>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {alternative.items.map((item, itemIndex) => (
                        <div
                          key={`${item.food_name}-${itemIndex}`}
                          className="flex justify-between gap-3 text-xs text-slate-400"
                        >
                          <span>{item.food_name}</span>
                          <span className="shrink-0">
                            {item.quantity_label ?? ""}
                          </span>
                        </div>
                      ))}
                    </ul>
                    <p className="mt-1 text-xs text-slate-400">
                      {macroLine(alternative.totals)}
                    </p>
                  </div>
                ))}
              </li>
            );
          })}
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
                  ? "bg-brand-600 text-white"
                  : "bg-surface border border-slate-300 text-slate-600",
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
