import type { WorkoutDay } from "@/types/workout";

import { todaysWorkout } from "./today";

function day(
  id: string,
  dayOfWeek: string,
  overrides: Partial<WorkoutDay> = {},
): WorkoutDay {
  return {
    id,
    week_number: 1,
    day_of_week_es: dayOfWeek,
    exercise_count: 8,
    last_performed_on: null,
    ...overrides,
  };
}

// 2026-10-19 is a Monday; 2026-10-20 a Tuesday.
const MONDAY = new Date(2026, 9, 19);
const TUESDAY = new Date(2026, 9, 20);

describe("todaysWorkout", () => {
  it("puts today's session first", () => {
    const result = todaysWorkout(
      [day("lun", "Lunes"), day("jue", "Jueves")],
      MONDAY,
    );

    expect(result).toEqual({
      day: expect.objectContaining({ id: "lun" }),
      isToday: true,
    });
  });

  it("on a rest day, points at the next day that trains", () => {
    const result = todaysWorkout(
      [day("lun", "Lunes"), day("jue", "Jueves")],
      TUESDAY,
    );

    expect(result?.day.id).toBe("jue");
    expect(result?.isToday).toBe(false);
  });

  it("wraps round the week", () => {
    const result = todaysWorkout([day("lun", "Lunes")], TUESDAY);

    expect(result?.day.id).toBe("lun");
  });

  it("in a plan of several weeks, takes the Monday done longest ago", () => {
    const result = todaysWorkout(
      [
        day("s1", "Lunes", { week_number: 1, last_performed_on: "2026-10-12" }),
        day("s2", "Lunes", { week_number: 2, last_performed_on: null }),
        day("s3", "Lunes", { week_number: 3, last_performed_on: "2026-10-05" }),
      ],
      MONDAY,
    );

    expect(result?.day.id).toBe("s2");
  });

  it("skips days with nothing to train, and gives up on an empty plan", () => {
    expect(
      todaysWorkout([day("lun", "Lunes", { exercise_count: 0 })], MONDAY),
    ).toBeNull();
    expect(todaysWorkout([], MONDAY)).toBeNull();
  });
});
