import {
  addExercises,
  addSupersetExercises,
  buildWeekDraft,
  countExercises,
  moveBlock,
  removeExercise,
  setSupersetNote,
  supersetNoteOf,
  ungroupSuperset,
  updateExercise,
  weekDraftToPayload,
} from "./week-draft";
import type { TrainingWeek } from "@/types/training-plan";

const week: TrainingWeek = {
  id: "w1",
  week_number: 1,
  notes: null,
  days: [
    {
      id: "d1",
      day_of_week: "wednesday",
      order_index: 0,
      exercises: [
        {
          id: "e2",
          exercise_id: "Squat",
          order_index: 1,
          sets: 4,
          reps: "8-10",
          rest_seconds: 90,
          tempo: null,
          superset_group: null,
          notes: null,
          superset_note: null,
        },
        {
          id: "e1",
          exercise_id: "Bench_Press",
          order_index: 0,
          sets: 3,
          reps: "10",
          rest_seconds: null,
          tempo: null,
          superset_group: null,
          notes: "Suave",
          superset_note: null,
        },
      ],
    },
  ],
};

describe("buildWeekDraft", () => {
  it("always yields the seven weekdays in order", () => {
    const draft = buildWeekDraft(week);

    expect(draft).toHaveLength(7);
    expect(draft[0].day_of_week).toBe("monday");
    expect(draft[6].day_of_week).toBe("sunday");
  });

  it("sorts each day's exercises by their stored order", () => {
    const wednesday = buildWeekDraft(week)[2];

    expect(wednesday.exercises.map((item) => item.exercise_id)).toEqual([
      "Bench_Press",
      "Squat",
    ]);
  });

  it("leaves untouched days empty", () => {
    expect(countExercises(buildWeekDraft(week))).toBe(2);
    expect(buildWeekDraft(week)[0].exercises).toEqual([]);
  });
});

describe("weekDraftToPayload", () => {
  it("drops rest days and renumbers order indexes from zero", () => {
    const payload = weekDraftToPayload(buildWeekDraft(week));

    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({ day_of_week: "wednesday", order_index: 0 });
    expect(payload[0].exercises.map((item) => item.order_index)).toEqual([0, 1]);
  });

  it("returns an empty payload when every day is a rest day", () => {
    const emptyWeek: TrainingWeek = { ...week, days: [] };

    expect(weekDraftToPayload(buildWeekDraft(emptyWeek))).toEqual([]);
  });
});

describe("draft mutations", () => {
  const draft = buildWeekDraft(week);

  it("adds exercises to the end of a day without touching the others", () => {
    const next = addExercises(draft, "monday", ["Deadlift", "Row"]);

    expect(next[0].exercises.map((item) => item.exercise_id)).toEqual([
      "Deadlift",
      "Row",
    ]);
    expect(next[2].exercises).toHaveLength(2);
    expect(draft[0].exercises).toHaveLength(0);
  });

  it("removes a single exercise by key", () => {
    const key = draft[2].exercises[0].key;
    const next = removeExercise(draft, "wednesday", key);

    expect(next[2].exercises.map((item) => item.exercise_id)).toEqual(["Squat"]);
    expect(draft[2].exercises).toHaveLength(2);
  });

  it("updates only the targeted exercise", () => {
    const key = draft[2].exercises[0].key;
    const next = updateExercise(draft, "wednesday", key, { sets: 5, reps: "5" });

    expect(next[2].exercises[0]).toMatchObject({ sets: 5, reps: "5" });
    expect(next[2].exercises[1]).toMatchObject({ sets: 4, reps: "8-10" });
    expect(draft[2].exercises[0].sets).toBe(3);
  });

  it("reorders exercises within a day", () => {
    const next = moveBlock(draft, "wednesday", 0, 1);

    expect(next[2].exercises.map((item) => item.exercise_id)).toEqual([
      "Squat",
      "Bench_Press",
    ]);
  });

  it("ignores out-of-range moves", () => {
    expect(moveBlock(draft, "wednesday", 0, 9)).toEqual(draft);
    expect(moveBlock(draft, "wednesday", 1, 1)).toEqual(draft);
  });
});

describe("supersets", () => {
  const draft = buildWeekDraft(week);

  it("adds the picked exercises chained under one group", () => {
    const next = addSupersetExercises(draft, "monday", ["Dip", "Pushdown"]);
    const groups = next[0].exercises.map((item) => item.superset_group);

    expect(groups[0]).not.toBeNull();
    expect(groups[0]).toBe(groups[1]);
  });

  it("gives every superset of a day its own group", () => {
    const first = addSupersetExercises(draft, "monday", ["Dip", "Pushdown"]);
    const second = addSupersetExercises(first, "monday", ["Curl", "Hammer"]);
    const groups = second[0].exercises.map((item) => item.superset_group);

    expect(new Set(groups).size).toBe(2);
  });

  it("keeps each exercise's own sets and reps", () => {
    const next = addSupersetExercises(draft, "monday", ["Dip", "Pushdown"]);
    const [first] = next[0].exercises;
    const updated = updateExercise(next, "monday", first.key, { reps: "12" });

    expect(updated[0].exercises[0].reps).toBe("12");
    expect(updated[0].exercises[1].reps).toBe("10");
  });

  it("breaks the block up on ungroup, keeping the exercises", () => {
    const next = addSupersetExercises(draft, "monday", ["Dip", "Pushdown"]);
    const group = next[0].exercises[0].superset_group as number;
    const ungrouped = ungroupSuperset(next, "monday", group);

    expect(ungrouped[0].exercises).toHaveLength(2);
    expect(
      ungrouped[0].exercises.every((item) => item.superset_group === null),
    ).toBe(true);
  });

  it("unchains the half left alone when the other one is removed", () => {
    const next = addSupersetExercises(draft, "monday", ["Dip", "Pushdown"]);
    const removed = removeExercise(next, "monday", next[0].exercises[0].key);

    expect(removed[0].exercises).toHaveLength(1);
    expect(removed[0].exercises[0].superset_group).toBeNull();
  });

  it("writes the block's note on the exercise that opens it", () => {
    const next = addSupersetExercises(draft, "monday", ["Dip", "Pushdown"]);
    const group = next[0].exercises[0].superset_group as number;
    const noted = setSupersetNote(next, "monday", group, "Sin soltar la barra");

    expect(noted[0].exercises[0].superset_note).toBe("Sin soltar la barra");
    expect(noted[0].exercises[1].superset_note).toBeNull();
    expect(supersetNoteOf(noted[0].exercises)).toBe("Sin soltar la barra");
  });

  it("keeps one note per block when two are written on the same day", () => {
    const first = addSupersetExercises(draft, "monday", ["Dip", "Pushdown"]);
    const second = addSupersetExercises(first, "monday", ["Curl", "Hammer"]);
    const groups = second[0].exercises.map((item) => item.superset_group);
    const noted = setSupersetNote(
      setSupersetNote(second, "monday", groups[0] as number, "Primera"),
      "monday",
      groups[2] as number,
      "Segunda",
    );

    expect(
      noted[0].exercises.map((item) => item.superset_note),
    ).toEqual(["Primera", null, "Segunda", null]);
  });

  it("drops the note when the block it described is broken up", () => {
    const next = addSupersetExercises(draft, "monday", ["Dip", "Pushdown"]);
    const group = next[0].exercises[0].superset_group as number;
    const noted = setSupersetNote(next, "monday", group, "Sin soltar la barra");
    const ungrouped = ungroupSuperset(noted, "monday", group);

    expect(supersetNoteOf(ungrouped[0].exercises)).toBeNull();
  });

  it("carries the block's note into the payload", () => {
    const next = addSupersetExercises(draft, "monday", ["Dip", "Pushdown"]);
    const group = next[0].exercises[0].superset_group as number;
    const noted = setSupersetNote(next, "monday", group, "Sin soltar la barra");
    const [monday] = weekDraftToPayload(noted);

    expect(monday.exercises[0].superset_note).toBe("Sin soltar la barra");
    expect(monday.exercises[1].superset_note).toBeNull();
  });

  it("moves a superset as a whole", () => {
    const withBlock = addSupersetExercises(draft, "wednesday", ["Dip", "Push"]);
    const moved = moveBlock(withBlock, "wednesday", 2, 0);

    expect(moved[2].exercises.map((item) => item.exercise_id)).toEqual([
      "Dip",
      "Push",
      "Bench_Press",
      "Squat",
    ]);
  });
});
