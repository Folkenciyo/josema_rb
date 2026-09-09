import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WorkoutSessionView } from "./workout-session-view";
import {
  useWorkoutDay,
  useWorkoutState,
  useWorkoutSync,
} from "@/hooks/use-workouts";
import { queueSession } from "@/lib/workout/session-store";
import type { SessionDraft } from "@/lib/workout/session-draft";
import type { WorkoutDayDetail } from "@/types/workout";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/hooks/use-workouts");
jest.mock("@/lib/workout/session-store");

const mockUseWorkoutDay = useWorkoutDay as jest.Mock;
const mockUseWorkoutState = useWorkoutState as jest.Mock;
const mockUseWorkoutSync = useWorkoutSync as jest.Mock;
const mockQueueSession = queueSession as jest.Mock;

const DAY: WorkoutDayDetail = {
  id: "day-1",
  week_number: 1,
  day_of_week_es: "Lunes",
  plan_title: "Plan",
  notes: null,
  exercises: [
    {
      id: "plan-ex-1",
      exercise_id: "ex-1",
      name_es: "Press banca",
      image_path: null,
      sets: 1,
      measurement: "reps",
      reps: "10",
      duration_seconds: null,
      rest_seconds: null,
      tempo: null,
      notes: null,
      superset_note: null,
      superset_group: null,
      last_performed_on: null,
      last_sets: [],
    },
  ],
};

const DRAFT: SessionDraft = {
  deviceSessionId: "device-1",
  dayId: "day-1",
  dayLabel: "Lunes",
  planTitle: "Plan",
  startedAt: "2026-08-11T18:00:00.000Z",
  notes: "",
  exercises: [
    {
      planExerciseId: "plan-ex-1",
      exerciseId: "ex-1",
      name: "Press banca",
      imagePath: null,
      targetSets: 1,
      targetMeasurement: "reps",
      targetReps: "10",
      targetDurationSeconds: null,
      restSeconds: null,
      notes: null,
      supersetNote: null,
      lastPerformedOn: null,
      lastSets: [],
      sets: [{ setNumber: 1, weightKg: 20, reps: 10, done: true }],
      supersetLabel: null,
      chainedTo: null,
    },
  ],
};

describe("WorkoutSessionView save", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkoutDay.mockReturnValue({
      data: DAY,
      isPending: false,
      error: null,
    });
    mockUseWorkoutState.mockReturnValue({ draft: DRAFT });
    mockUseWorkoutSync.mockReturnValue({ flush: jest.fn(), isSending: false });
  });

  it("shows a loading screen, not a lost-session error, while the router is still navigating away", async () => {
    const user = userEvent.setup();
    // queueSession clears the draft synchronously, just like the real store does,
    // before router.push has actually left this screen.
    mockQueueSession.mockImplementation(() => {
      mockUseWorkoutState.mockReturnValue({ draft: null });
    });

    render(<WorkoutSessionView token="tok" dayId="day-1" />);

    await user.click(
      screen.getByRole("button", { name: /continuar la sesión/i }),
    );
    await user.click(screen.getByRole("button", { name: /terminar/i }));
    await user.click(screen.getByRole("button", { name: /guardar sesión/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});
