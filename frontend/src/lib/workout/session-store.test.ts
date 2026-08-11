/**
 * The store caches the device's state in a module variable, so every test loads
 * a fresh copy — exactly like a new page load on the phone would.
 */
import type { WorkoutSessionInput } from "@/types/workout";

type Store = typeof import("./session-store");

async function freshStore(): Promise<Store> {
  jest.resetModules();
  return import("./session-store");
}

const DRAFT = {
  deviceSessionId: "device-1",
  dayId: "day-1",
  dayLabel: "Lunes",
  planTitle: "Plan",
  startedAt: "2026-08-11T18:00:00.000Z",
  notes: "",
  exercises: [],
};

const PAYLOAD: WorkoutSessionInput = {
  device_session_id: "device-1",
  training_day_id: "day-1",
  performed_on: "2026-08-11",
  notes: null,
  sets: [],
};

beforeEach(() => {
  window.localStorage.clear();
});

it("keeps the session going after the phone locks and the app reloads", async () => {
  const store = await freshStore();

  store.setDraft(DRAFT);
  const reloaded = await freshStore();

  expect(reloaded.getSnapshot().draft).toEqual(DRAFT);
});

it("finishing a session closes the draft and parks it to be sent", async () => {
  const store = await freshStore();
  store.setDraft(DRAFT);

  store.queueSession(PAYLOAD, "2026-08-11T19:00:00.000Z");

  expect(store.getSnapshot().draft).toBeNull();
  expect(store.getSnapshot().queue).toHaveLength(1);
});

it("drops the session once the server has it", async () => {
  const store = await freshStore();
  store.queueSession(PAYLOAD, "2026-08-11T19:00:00.000Z");

  store.acknowledgeSession("device-1");

  expect(store.getSnapshot().queue).toEqual([]);
  expect(await freshStore().then((next) => next.getSnapshot().queue)).toEqual(
    [],
  );
});

it("tells the screens whenever anything changes", async () => {
  const store = await freshStore();
  const listener = jest.fn();
  const unsubscribe = store.subscribe(listener);

  store.setDraft(DRAFT);
  unsubscribe();
  store.discardDraft();

  expect(listener).toHaveBeenCalledTimes(1);
});

it("knows nothing while rendering on the server", async () => {
  const store = await freshStore();
  store.setDraft(DRAFT);

  expect(store.getServerSnapshot()).toEqual({
    draft: null,
    queue: [],
    rejected: null,
  });
});

it("keeps the reason a session was lost, which no screen may swallow", async () => {
  const store = await freshStore();
  store.queueSession(PAYLOAD, "2026-08-11T19:00:00.000Z");

  store.rejectSession("device-1", "La fecha de la sesión no es válida");

  // Out of the queue — retrying would fail the same way — but still on screen,
  // even after leaving the session and landing on the list of days.
  expect(store.getSnapshot().queue).toEqual([]);
  expect(store.getSnapshot().rejected).toBe(
    "La fecha de la sesión no es válida",
  );

  store.dismissRejection();
  expect(store.getSnapshot().rejected).toBeNull();
});

it("clears an old rejection when a new session is finished", async () => {
  const store = await freshStore();
  store.queueSession(PAYLOAD, "t1");
  store.rejectSession("device-1", "algo falló");

  store.queueSession({ ...PAYLOAD, device_session_id: "device-2" }, "t2");

  expect(store.getSnapshot().rejected).toBeNull();
});
