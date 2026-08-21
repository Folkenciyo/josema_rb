import {
  buildMonthGrid,
  firstDayOf,
  lastDayOf,
  monthOf,
  shiftMonth,
} from "./calendar";
import type { TrainingCalendarDay } from "@/types/workout";

const day = (
  date: string,
  overrides: Partial<TrainingCalendarDay> = {},
): TrainingCalendarDay => ({
  date,
  trained: false,
  planned: true,
  session_id: null,
  set_count: null,
  exercise_count: 4,
  ...overrides,
});

describe("shiftMonth", () => {
  it("walks forward across the turn of the year", () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({
      year: 2027,
      month: 1,
    });
  });

  it("walks backwards across it too", () => {
    // JS modulo of a negative is negative: January minus one must not be month 0.
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({
      year: 2025,
      month: 12,
    });
  });

  it("jumps whole years", () => {
    expect(shiftMonth({ year: 2026, month: 3 }, -14)).toEqual({
      year: 2025,
      month: 1,
    });
  });
});

describe("month bounds", () => {
  it("closes a 31 day month", () => {
    expect(lastDayOf({ year: 2026, month: 8 })).toBe("2026-08-31");
  });

  it("knows February in a leap year", () => {
    expect(lastDayOf({ year: 2028, month: 2 })).toBe("2028-02-29");
    expect(lastDayOf({ year: 2026, month: 2 })).toBe("2026-02-28");
  });

  it("pads the month in the first day", () => {
    expect(firstDayOf({ year: 2026, month: 9 })).toBe("2026-09-01");
  });

  it("reads a month out of an ISO day", () => {
    expect(monthOf("2026-08-21")).toEqual({ year: 2026, month: 8 });
  });
});

describe("buildMonthGrid", () => {
  it("pads to whole weeks starting on Monday", () => {
    // 1 August 2026 is a Saturday: five empty cells before it.
    const cells = buildMonthGrid({ year: 2026, month: 8 }, [], "2026-08-21");

    expect(cells.length % 7).toBe(0);
    expect(cells.slice(0, 5).every((cell) => cell.date === null)).toBe(true);
    expect(cells[5].date).toBe("2026-08-01");
    expect(cells[cells.length - 1].date).toBe(null);
  });

  it("hangs each day's entry on its cell", () => {
    const cells = buildMonthGrid(
      { year: 2026, month: 8 },
      [day("2026-08-03", { trained: true, set_count: 12 })],
      "2026-08-21",
    );
    const third = cells.find((cell) => cell.date === "2026-08-03");

    expect(third?.entry?.trained).toBe(true);
    expect(third?.entry?.set_count).toBe(12);
    // A day the backend said nothing about carries no entry, not an empty one.
    expect(cells.find((cell) => cell.date === "2026-08-04")?.entry).toBeNull();
  });

  it("marks today and tells the future apart from the past", () => {
    const cells = buildMonthGrid({ year: 2026, month: 8 }, [], "2026-08-21");

    expect(cells.find((cell) => cell.date === "2026-08-21")?.isToday).toBe(true);
    expect(cells.find((cell) => cell.date === "2026-08-20")?.isFuture).toBe(
      false,
    );
    // A planned day still to come is not a missed one, and the card leans on this.
    expect(cells.find((cell) => cell.date === "2026-08-22")?.isFuture).toBe(
      true,
    );
  });

  it("covers a month that starts on Monday with no padding", () => {
    const cells = buildMonthGrid({ year: 2026, month: 6 }, [], "2026-08-21");

    expect(cells[0].date).toBe("2026-06-01");
  });
});
