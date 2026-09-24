import { fireEvent, render, screen } from "@testing-library/react";

import { TrainingWeekEditor } from "./training-week-editor";
import { useExerciseMap } from "@/hooks/use-exercises";
import { useSaveTrainingWeekDays } from "@/hooks/use-training-plans";
import type { Exercise } from "@/types/exercise";
import type { TrainingWeek } from "@/types/training-plan";

jest.mock("@/hooks/use-exercises");
jest.mock("@/hooks/use-training-plans");

const mockUseExerciseMap = useExerciseMap as jest.Mock;
const mockUseSaveTrainingWeekDays = useSaveTrainingWeekDays as jest.Mock;

const EXERCISE: Exercise = {
  id: "exercise-1",
  name_es: "Sentadilla",
  category_es: null,
  level_es: null,
  force_es: null,
  mechanic_es: null,
  equipment_es: null,
  primary_muscles_es: [],
  secondary_muscles_es: [],
  instructions_es: [],
  images: [],
  created_by_trainer_id: null,
  source: "seed",
  is_hidden: false,
};

const WEEK: TrainingWeek = {
  id: "week-1",
  week_number: 1,
  notes: null,
  days: [
    {
      id: "day-1",
      day_of_week: "monday",
      order_index: 0,
      notes: null,
      exercises: [
        {
          id: "day-exercise-1",
          exercise_id: "exercise-1",
          order_index: 0,
          sets: 3,
          measurement: "reps",
          reps: "10",
          duration_seconds: null,
          rest_seconds: null,
          tempo: null,
          superset_group: null,
          notes: null,
          superset_note: null,
          planned_sets: [
            { set_number: 1, reps: "10", duration_seconds: null, modifier: "normal", rir_value: null },
            { set_number: 2, reps: "10", duration_seconds: null, modifier: "normal", rir_value: null },
            { set_number: 3, reps: "10", duration_seconds: null, modifier: "normal", rir_value: null },
          ],
        },
      ],
    },
  ],
};

describe("TrainingWeekEditor autosave", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseExerciseMap.mockReturnValue({
      exerciseMap: new Map([["exercise-1", EXERCISE]]),
      isPending: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("flushes a set's modifier change on unmount instead of losing it to the cancelled debounce", () => {
    const mutate = jest.fn();
    mockUseSaveTrainingWeekDays.mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    });

    const { unmount } = render(
      <TrainingWeekEditor planId="plan-1" week={WEEK} />,
    );

    fireEvent.change(screen.getByLabelText("Tipo de la serie 3"), {
      target: { value: "to_failure" },
    });

    // Well within the 800ms debounce window: the regular autosave path
    // hasn't fired yet.
    jest.advanceTimersByTime(200);
    expect(mutate).not.toHaveBeenCalled();

    // Switching week tabs (or leaving the page) unmounts the editor here —
    // before the debounce would ever get a chance to run.
    unmount();

    expect(mutate).toHaveBeenCalledTimes(1);
    const [{ weekId, days }] = mutate.mock.calls[0];
    expect(weekId).toBe("week-1");
    expect(days[0].exercises[0].planned_sets[2]).toMatchObject({
      set_number: 3,
      modifier: "to_failure",
    });
  });

  it("does not call mutate on unmount when nothing changed", () => {
    const mutate = jest.fn();
    mockUseSaveTrainingWeekDays.mockReturnValue({
      mutate,
      isPending: false,
      error: null,
    });

    const { unmount } = render(
      <TrainingWeekEditor planId="plan-1" week={WEEK} />,
    );

    unmount();

    expect(mutate).not.toHaveBeenCalled();
  });
});
