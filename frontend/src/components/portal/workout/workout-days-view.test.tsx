import { render, screen } from "@testing-library/react";

import { WorkoutDaysView } from "./workout-days-view";
import {
  usePortalWorkouts,
  useWorkoutDays,
  useWorkoutState,
  useWorkoutSync,
} from "@/hooks/use-workouts";
import type { WorkoutDay } from "@/types/workout";

jest.mock("@/hooks/use-workouts");

function day(id: string, week_number: number, day_of_week_es: string) {
  return {
    id,
    week_number,
    day_of_week_es,
    exercise_count: 5,
    last_performed_on: null,
  } satisfies WorkoutDay;
}

function renderWith(days: WorkoutDay[]) {
  (useWorkoutDays as jest.Mock).mockReturnValue({
    data: days,
    isPending: false,
    error: null,
  });
  (usePortalWorkouts as jest.Mock).mockReturnValue({ data: [] });
  (useWorkoutState as jest.Mock).mockReturnValue({ draft: null });
  (useWorkoutSync as jest.Mock).mockReturnValue({
    pendingCount: 0,
    isSending: false,
    rejected: null,
    dismissRejected: jest.fn(),
  });
  render(<WorkoutDaysView token="tok" />);
}

it("says which week each day belongs to when the routine has several", () => {
  renderWith([
    day("a", 1, "Lunes"),
    day("b", 1, "Jueves"),
    day("c", 2, "Lunes"),
  ]);

  const headings = screen.getAllByRole("heading", { name: /^Semana/ });
  expect(headings.map((heading) => heading.textContent)).toEqual([
    "Semana 1",
    "Semana 2",
  ]);
});

it("does not number a single week", () => {
  renderWith([day("a", 1, "Lunes"), day("b", 1, "Jueves")]);

  expect(screen.queryByRole("heading", { name: /^Semana/ })).toBeNull();
});
