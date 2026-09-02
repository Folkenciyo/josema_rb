import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExerciseStep } from "./exercise-step";
import type { DraftExercise, DraftSet } from "@/lib/workout/session-draft";

function draftSet(overrides: Partial<DraftSet> = {}): DraftSet {
  return { setNumber: 1, weightKg: null, reps: 10, done: false, ...overrides };
}

function draftExercise(overrides: Partial<DraftExercise> = {}): DraftExercise {
  return {
    planExerciseId: "plan-ex-1",
    exerciseId: null,
    name: "Press banca",
    imagePath: null,
    targetSets: 3,
    targetReps: "8-12",
    restSeconds: 90,
    notes: null,
    supersetNote: null,
    lastPerformedOn: null,
    lastSets: [],
    sets: [draftSet()],
    supersetLabel: null,
    chainedTo: null,
    ...overrides,
  };
}

describe("ExerciseStep weight field", () => {
  it("keeps the decimal separator instead of snapping back to a whole number", async () => {
    const user = userEvent.setup();
    const onChangeSet = jest.fn();

    render(
      <ExerciseStep
        token="tok"
        exercise={draftExercise()}
        onChangeSet={onChangeSet}
        onToggleSet={jest.fn()}
        onRemoveSet={jest.fn()}
        onAddSet={jest.fn()}
      />,
    );

    const weightInput = screen.getByLabelText("Peso de la serie 1");
    await user.type(weightInput, "9,25");

    expect(weightInput).toHaveValue("9,25");
    expect(onChangeSet).toHaveBeenLastCalledWith(1, { weightKg: 9.25 });
  });
});
