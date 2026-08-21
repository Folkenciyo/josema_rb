import type { TrainingCalendarDay } from "@/types/workout";

/** Monday first: the whole app reads weeks the Spanish way. */
export const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export interface CalendarCell {
  /** ISO day, or null for the padding before the 1st and after the last. */
  date: string | null;
  dayOfMonth: number | null;
  /** What the backend said about this day, when it said anything. */
  entry: TrainingCalendarDay | null;
  isToday: boolean;
  isFuture: boolean;
}

/** A month as the user sees it: `2026-08`. */
export interface MonthKey {
  year: number;
  /** 1-12, not the 0-11 of the Date constructor. */
  month: number;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function isoDay(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function monthOf(isoDate: string): MonthKey {
  const [year, month] = isoDate.split("-").map(Number);
  return { year, month };
}

/**
 * Today in the browser's own timezone. `toISOString()` would hand back the
 * previous day for anyone west of UTC, which is exactly the bug that would make
 * a session look like it was trained yesterday.
 */
export function todayIso(): string {
  const now = new Date();
  return isoDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function shiftMonth({ year, month }: MonthKey, delta: number): MonthKey {
  const zeroBased = month - 1 + delta;
  return {
    year: year + Math.floor(zeroBased / 12),
    // Modulo of a negative number is negative in JS, hence the extra turn.
    month: ((zeroBased % 12) + 12) % 12 + 1,
  };
}

export function firstDayOf({ year, month }: MonthKey): string {
  return isoDay(year, month, 1);
}

export function lastDayOf({ year, month }: MonthKey): string {
  // Day 0 of the next month is the last day of this one, leap years included.
  return isoDay(year, month, new Date(year, month, 0).getDate());
}

export function monthLabel({ year, month }: MonthKey): string {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

/**
 * The grid of a month, padded to whole weeks starting on Monday, with each
 * day's entry already attached. Always full weeks so the columns line up under
 * their weekday heading.
 */
export function buildMonthGrid(
  monthKey: MonthKey,
  days: TrainingCalendarDay[],
  today = todayIso(),
): CalendarCell[] {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const { year, month } = monthKey;
  const daysInMonth = new Date(year, month, 0).getDate();
  // getDay() is Sunday-first; this turns it into Monday-first.
  const leading = (new Date(year, month - 1, 1).getDay() + 6) % 7;

  const cells: CalendarCell[] = [];

  for (let index = 0; index < leading; index += 1) {
    cells.push(empty());
  }

  for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth += 1) {
    const date = isoDay(year, month, dayOfMonth);
    cells.push({
      date,
      dayOfMonth,
      entry: byDate.get(date) ?? null,
      isToday: date === today,
      isFuture: date > today,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(empty());
  }

  return cells;
}

function empty(): CalendarCell {
  return {
    date: null,
    dayOfMonth: null,
    entry: null,
    isToday: false,
    isFuture: false,
  };
}
