import {
  addSet,
  completedSets,
  createDraft,
  isEmpty,
  removeSet,
  toPayload,
  totalVolume,
  updateSet,
} from "./session-draft";
import type { WorkoutDayDetail } from "@/types/workout";

function day(overrides: Partial<WorkoutDayDetail> = {}): WorkoutDayDetail {
  return {
    id: "day-1",
    week_number: 1,
    day_of_week_es: "Lunes",
    plan_title: "Plan de fuerza",
    exercises: [
      {
        id: "plan-ex-1",
        name_es: "Press banca",
        image_path: null,
        sets: 3,
        reps: "8-12",
        rest_seconds: 90,
        tempo: null,
        notes: null,
        superset_group: null,
        last_performed_on: null,
        last_sets: [],
      },
    ],
    ...overrides,
  };
}

const START = "2026-08-11T18:00:00.000Z";

describe("createDraft", () => {
  it("lays out one row per set the plan asks for", () => {
    const draft = createDraft(day(), "device-1", START);

    expect(draft.exercises[0].sets.map((set) => set.setNumber)).toEqual([
      1, 2, 3,
    ]);
    expect(draft.exercises[0].sets.every((set) => !set.done)).toBe(true);
  });

  it("starts each set at what was lifted last time", () => {
    const withHistory = day({
      exercises: [
        {
          ...day().exercises[0],
          last_performed_on: "2026-08-04",
          last_sets: [
            { set_number: 1, weight_kg: 60, reps: 10 },
            { set_number: 2, weight_kg: 62.5, reps: 8 },
          ],
        },
      ],
    });

    const draft = createDraft(withHistory, "device-1", START);

    expect(draft.exercises[0].sets[0]).toMatchObject({
      weightKg: 60,
      reps: 10,
    });
    expect(draft.exercises[0].sets[1]).toMatchObject({
      weightKg: 62.5,
      reps: 8,
    });
    // Nothing was lifted for the third set last time, so there is nothing to offer.
    expect(draft.exercises[0].sets[2].weightKg).toBeNull();
  });

  it("fills in the reps when the target is a plain number, not a range", () => {
    const fixed = day({
      exercises: [{ ...day().exercises[0], reps: "10" }],
    });

    const draft = createDraft(fixed, "device-1", START);

    expect(draft.exercises[0].sets[0].reps).toBe(10);
    expect(
      createDraft(day(), "device-1", START).exercises[0].sets[0].reps,
    ).toBeNull();
  });
});

describe("editing a draft", () => {
  it("never mutates the draft it was given", () => {
    const draft = createDraft(day(), "device-1", START);

    const updated = updateSet(draft, 0, 1, { weightKg: 70, done: true });

    expect(draft.exercises[0].sets[0].weightKg).toBeNull();
    expect(updated.exercises[0].sets[0]).toMatchObject({
      weightKg: 70,
      done: true,
    });
  });

  it("takes an extra set carrying over the last weight", () => {
    const draft = updateSet(createDraft(day(), "device-1", START), 0, 3, {
      weightKg: 65,
    });

    const withExtra = addSet(draft, 0);

    expect(withExtra.exercises[0].sets).toHaveLength(4);
    expect(withExtra.exercises[0].sets[3]).toMatchObject({
      setNumber: 4,
      weightKg: 65,
    });
  });

  it("refuses to leave an exercise with no sets at all", () => {
    let draft = createDraft(
      day({ exercises: [day().exercises[0]] }),
      "d",
      START,
    );
    draft = removeSet(draft, 0, 3);
    draft = removeSet(draft, 0, 2);

    const stripped = removeSet(draft, 0, 1);

    expect(stripped.exercises[0].sets).toHaveLength(1);
  });
});

describe("what gets sent", () => {
  it("only carries the sets that were ticked off", () => {
    let draft = createDraft(day(), "device-1", START);
    draft = updateSet(draft, 0, 1, { weightKg: 60, reps: 10, done: true });
    draft = updateSet(draft, 0, 2, { weightKg: 60, reps: 9, done: true });

    const payload = toPayload(draft, "2026-08-11");

    expect(payload.sets).toHaveLength(2);
    expect(payload.sets[0]).toMatchObject({
      training_day_exercise_id: "plan-ex-1",
      exercise_name: "Press banca",
      order_index: 0,
      set_number: 1,
      weight_kg: 60,
      reps: 10,
    });
    expect(payload.device_session_id).toBe("device-1");
    expect(payload.performed_on).toBe("2026-08-11");
  });

  it("sends no notes rather than an empty string", () => {
    const draft = createDraft(day(), "device-1", START);

    expect(toPayload(draft, "2026-08-11").notes).toBeNull();
  });

  it("knows when there is nothing worth sending", () => {
    const draft = createDraft(day(), "device-1", START);

    expect(isEmpty(draft)).toBe(true);
    expect(isEmpty(updateSet(draft, 0, 1, { done: true }))).toBe(false);
  });
});

describe("session totals", () => {
  it("counts only the volume of sets that were done", () => {
    let draft = createDraft(day(), "device-1", START);
    draft = updateSet(draft, 0, 1, { weightKg: 60, reps: 10, done: true });
    draft = updateSet(draft, 0, 2, { weightKg: 100, reps: 5, done: false });

    expect(totalVolume(draft)).toBe(600);
    expect(completedSets(draft)).toBe(1);
  });
});
