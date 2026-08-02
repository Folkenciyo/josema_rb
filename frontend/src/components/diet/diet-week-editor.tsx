"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Save } from "lucide-react";

import { useMenus } from "@/hooks/use-diet-catalog";
import { useAssignMenu, useSaveDietWeekDays } from "@/hooks/use-diet-plans";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Select } from "@/components/ui/input";
import {
  buildDietWeekDraft,
  countAssignedDays,
  dietWeekDraftToPayload,
  setDayMenu,
} from "@/lib/diet/diet-week-draft";
import { DAY_LABELS } from "@/types/common";
import type { DietWeek } from "@/types/diet-plan";
import { AssignMenuModal } from "./assign-menu-modal";
import { MacroSummary } from "./macro-summary";

interface DietWeekEditorProps {
  planId: string;
  week: DietWeek;
  caloriesTarget: number | null;
}

/** Mounted with `key={week.id}` by the parent, so switching weeks resets the draft. */
export function DietWeekEditor({
  planId,
  week,
  caloriesTarget,
}: DietWeekEditorProps) {
  const { data: menus } = useMenus();
  const saveDays = useSaveDietWeekDays(planId);
  const assignMenu = useAssignMenu(planId);

  const [draft, setDraft] = useState(() => buildDietWeekDraft(week));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(dietWeekDraftToPayload(buildDietWeekDraft(week))),
  );
  const [isAssignOpen, setAssignOpen] = useState(false);

  const menuMap = useMemo(
    () => new Map((menus ?? []).map((menu) => [menu.id, menu])),
    [menus],
  );

  const payload = useMemo(() => dietWeekDraftToPayload(draft), [draft]);
  const isDirty = JSON.stringify(payload) !== savedSnapshot;

  const handleSave = () =>
    saveDays.mutate(
      { weekId: week.id, days: payload },
      { onSuccess: () => setSavedSnapshot(JSON.stringify(payload)) },
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {countAssignedDays(draft)} de 7 días con menú
          {isDirty && (
            <span className="ml-2 font-medium text-amber-600">
              · cambios sin guardar
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setAssignOpen(true)}
            disabled={isDirty}
            title={
              isDirty ? "Guarda los cambios antes de asignar en bloque" : undefined
            }
          >
            <CalendarRange className="size-4" />
            Asignar a varios días
          </Button>
          <Button onClick={handleSave} disabled={!isDirty} loading={saveDays.isPending}>
            <Save className="size-4" />
            Guardar semana
          </Button>
        </div>
      </div>

      <ErrorMessage error={saveDays.error ?? assignMenu.error} />

      <ul className="flex flex-col gap-2">
        {draft.map((day) => {
          const menu = day.menu_id ? menuMap.get(day.menu_id) : undefined;
          const overTarget =
            caloriesTarget !== null &&
            menu !== undefined &&
            menu.totals.calories > caloriesTarget;

          return (
            <li
              key={day.day_of_week}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <span className="w-24 font-semibold text-slate-800">
                {DAY_LABELS[day.day_of_week]}
              </span>

              <Select
                value={day.menu_id ?? ""}
                aria-label={`Menú de ${DAY_LABELS[day.day_of_week]}`}
                onChange={(event) =>
                  setDraft((current) =>
                    setDayMenu(
                      current,
                      day.day_of_week,
                      event.target.value === "" ? null : event.target.value,
                    ),
                  )
                }
                className="h-9 w-auto min-w-52"
              >
                <option value="">Sin menú (día libre)</option>
                {(menus ?? []).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>

              {menu && (
                <div className="ml-auto flex items-center gap-3">
                  <MacroSummary totals={menu.totals} />
                  {overTarget && (
                    <span className="text-xs font-semibold text-amber-600">
                      sobre objetivo
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {isAssignOpen && (
        <AssignMenuModal
          isSubmitting={assignMenu.isPending}
          error={assignMenu.error}
          onClose={() => setAssignOpen(false)}
          onSubmit={(input) =>
            assignMenu.mutate(
              { weekId: week.id, input },
              {
                onSuccess: (updatedWeek) => {
                  const nextDraft = buildDietWeekDraft(updatedWeek);
                  setDraft(nextDraft);
                  setSavedSnapshot(
                    JSON.stringify(dietWeekDraftToPayload(nextDraft)),
                  );
                  setAssignOpen(false);
                },
              },
            )
          }
        />
      )}
    </div>
  );
}
