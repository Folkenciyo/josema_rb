import type { WorkoutDay } from "@/types/workout";

/** `Date.getDay()` order, the names the backend sends in `day_of_week_es`. */
const WEEKDAYS_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export interface TodaysWorkout {
  day: WorkoutDay;
  /** False when today is a rest day and `day` is the next one to train. */
  isToday: boolean;
}

/**
 * The session the portal's home puts first. In a plan of several weeks the
 * same weekday comes back once a week, so the one done longest ago (or never)
 * is the one that is due; on a rest day it is the next weekday that trains.
 */
export function todaysWorkout(
  days: WorkoutDay[],
  today: Date,
): TodaysWorkout | null {
  const training = days.filter((day) => day.exercise_count > 0);

  for (let offset = 0; offset < 7; offset++) {
    const name = WEEKDAYS_ES[(today.getDay() + offset) % 7];
    const candidates = training.filter((day) => day.day_of_week_es === name);
    if (candidates.length > 0) {
      const [due] = [...candidates].sort(
        (a, b) =>
          (a.last_performed_on ?? "").localeCompare(
            b.last_performed_on ?? "",
          ) || a.week_number - b.week_number,
      );
      return { day: due, isToday: offset === 0 };
    }
  }
  return null;
}
