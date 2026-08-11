import {
  clearDraft,
  dequeue,
  enqueue,
  isWorthRetrying,
  readDraft,
  readQueue,
  saveDraft,
  writeQueue,
} from "./storage";
import { createDraft } from "./session-draft";
import type { WorkoutDayDetail, WorkoutSessionInput } from "@/types/workout";

function fakeStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => void entries.set(key, value),
    removeItem: (key) => void entries.delete(key),
    clear: () => entries.clear(),
    key: (index) => [...entries.keys()][index] ?? null,
    get length() {
      return entries.size;
    },
  };
}

const DAY: WorkoutDayDetail = {
  id: "day-1",
  week_number: 1,
  day_of_week_es: "Lunes",
  plan_title: "Plan",
  exercises: [],
};

function payload(deviceSessionId: string): WorkoutSessionInput {
  return {
    device_session_id: deviceSessionId,
    training_day_id: "day-1",
    performed_on: "2026-08-11",
    notes: null,
    sets: [],
  };
}

describe("the draft in the phone", () => {
  it("survives closing the app mid session", () => {
    const storage = fakeStorage();
    const draft = createDraft(DAY, "device-1", "2026-08-11T18:00:00.000Z");

    saveDraft(storage, draft);

    expect(readDraft(storage)).toEqual(draft);
    clearDraft(storage);
    expect(readDraft(storage)).toBeNull();
  });

  it("shrugs off a corrupt entry instead of breaking the screen", () => {
    const storage = fakeStorage();
    storage.setItem("josema:workout-draft", "{not json");

    expect(readDraft(storage)).toBeNull();
  });
});

describe("the queue of sessions waiting for coverage", () => {
  it("starts empty and comes back as it was left", () => {
    const storage = fakeStorage();

    expect(readQueue(storage)).toEqual([]);
    writeQueue(
      storage,
      enqueue([], payload("device-1"), "2026-08-11T19:00:00Z"),
    );

    expect(readQueue(storage)).toHaveLength(1);
  });

  it("replaces a session instead of queueing it twice", () => {
    const first = enqueue([], payload("device-1"), "2026-08-11T19:00:00Z");

    const again = enqueue(first, payload("device-1"), "2026-08-11T19:05:00Z");

    expect(again).toHaveLength(1);
    expect(again[0].queuedAt).toBe("2026-08-11T19:05:00Z");
  });

  it("drops a session once the server has taken it", () => {
    const queue = enqueue(
      enqueue([], payload("device-1"), "t1"),
      payload("device-2"),
      "t2",
    );

    const left = dequeue(queue, "device-1");

    expect(left.map((pending) => pending.payload.device_session_id)).toEqual([
      "device-2",
    ]);
  });
});

describe("deciding whether to try again", () => {
  it.each([
    ["no network at all", 0],
    ["too many requests", 429],
    ["the server is down", 503],
  ])("keeps the session when it is %s", (_label, status) => {
    expect(isWorthRetrying(status)).toBe(true);
  });

  it.each([
    ["the link was revoked", 404],
    ["the date will never be accepted", 422],
  ])("gives up when %s, because retrying changes nothing", (_label, status) => {
    expect(isWorthRetrying(status)).toBe(false);
  });
});
