import {
  buildDietWeekDraft,
  countAssignedDays,
  dietWeekDraftToPayload,
  setAllDaysMenu,
  setDayMenu,
} from "./diet-week-draft";
import { EMPTY_TOTALS } from "./meal-draft";
import type { DietWeek } from "@/types/diet-plan";

const week: DietWeek = {
  id: "w1",
  week_number: 1,
  notes: null,
  days: [
    {
      id: "d1",
      day_of_week: "tuesday",
      order_index: 0,
      menu: { id: "menu-1", name: "Día alto" },
      totals: {
        ...EMPTY_TOTALS,
        calories: 2000,
        protein_g: 150,
        carbs_g: 200,
        fat_g: 60,
      },
    },
    {
      id: "d2",
      day_of_week: "sunday",
      order_index: 1,
      menu: null,
      totals: null,
    },
  ],
};

describe("buildDietWeekDraft", () => {
  it("returns the seven weekdays with their assigned menu", () => {
    const draft = buildDietWeekDraft(week);

    expect(draft).toHaveLength(7);
    expect(draft[1]).toEqual({ day_of_week: "tuesday", menu_id: "menu-1" });
    expect(draft[0].menu_id).toBeNull();
  });

  it("treats a stored day without menu as unassigned", () => {
    expect(buildDietWeekDraft(week)[6].menu_id).toBeNull();
    expect(countAssignedDays(buildDietWeekDraft(week))).toBe(1);
  });
});

describe("dietWeekDraftToPayload", () => {
  it("sends only the days that have a menu, renumbered", () => {
    const draft = setDayMenu(buildDietWeekDraft(week), "friday", "menu-2");
    const payload = dietWeekDraftToPayload(draft);

    expect(payload).toEqual([
      { day_of_week: "tuesday", order_index: 0, menu_id: "menu-1" },
      { day_of_week: "friday", order_index: 1, menu_id: "menu-2" },
    ]);
  });

  it("is empty when no day has a menu", () => {
    expect(dietWeekDraftToPayload(setAllDaysMenu(buildDietWeekDraft(week), null))).toEqual(
      [],
    );
  });
});

describe("menu assignment helpers", () => {
  it("assigns the same menu to the whole week", () => {
    const draft = setAllDaysMenu(buildDietWeekDraft(week), "menu-3");

    expect(countAssignedDays(draft)).toBe(7);
    expect(new Set(draft.map((day) => day.menu_id))).toEqual(new Set(["menu-3"]));
  });

  it("clears a single day without touching the rest", () => {
    const full = setAllDaysMenu(buildDietWeekDraft(week), "menu-3");
    const next = setDayMenu(full, "monday", null);

    expect(next[0].menu_id).toBeNull();
    expect(countAssignedDays(next)).toBe(6);
    expect(countAssignedDays(full)).toBe(7);
  });
});
