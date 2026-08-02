import { DAYS_OF_WEEK, type DayOfWeek } from "@/types/common";
import type { DietDayInput, DietWeek } from "@/types/diet-plan";

export interface DietDayDraft {
  day_of_week: DayOfWeek;
  menu_id: string | null;
}

export type DietWeekDraft = DietDayDraft[];

/** Every weekday is present; `menu_id === null` means a day with no menu assigned. */
export function buildDietWeekDraft(week: DietWeek): DietWeekDraft {
  return DAYS_OF_WEEK.map((day) => {
    const existing = week.days.find((item) => item.day_of_week === day);

    return { day_of_week: day, menu_id: existing?.menu?.id ?? null };
  });
}

/** Days without a menu are dropped, so exported documents show no empty days. */
export function dietWeekDraftToPayload(draft: DietWeekDraft): DietDayInput[] {
  return draft
    .filter((day) => day.menu_id !== null)
    .map((day, index) => ({
      day_of_week: day.day_of_week,
      order_index: index,
      menu_id: day.menu_id,
    }));
}

export function setDayMenu(
  draft: DietWeekDraft,
  day: DayOfWeek,
  menuId: string | null,
): DietWeekDraft {
  return draft.map((item) =>
    item.day_of_week === day ? { ...item, menu_id: menuId } : item,
  );
}

export function setAllDaysMenu(
  draft: DietWeekDraft,
  menuId: string | null,
): DietWeekDraft {
  return draft.map((item) => ({ ...item, menu_id: menuId }));
}

export function countAssignedDays(draft: DietWeekDraft): number {
  return draft.filter((day) => day.menu_id !== null).length;
}
