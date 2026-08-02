import {
  addExercises,
  buildWeekDraft,
  countExercises,
  moveExercise,
  removeExercise,
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
    const next = moveExercise(draft, "wednesday", 0, 1);

    expect(next[2].exercises.map((item) => item.exercise_id)).toEqual([
      "Squat",
      "Bench_Press",
    ]);
  });

  it("ignores out-of-range moves", () => {
    expect(moveExercise(draft, "wednesday", 0, 9)).toEqual(draft);
    expect(moveExercise(draft, "wednesday", 1, 1)).toEqual(draft);
  });
});
