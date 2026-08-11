import {
  clearDraft,
  dequeue,
  enqueue,
  readDraft,
  readQueue,
  saveDraft,
  writeQueue,
  type PendingSession,
} from "./storage";
import type { SessionDraft } from "./session-draft";
import type { WorkoutSessionInput } from "@/types/workout";

/**
 * The session in the phone, shared by every screen that needs it.
 *
 * It lives outside React because it also lives outside this page load: the draft
 * and the queue are read back from the device, and a component that mounts later
 * must see exactly what the one before it left behind.
 */
export interface WorkoutState {
  draft: SessionDraft | null;
  queue: PendingSession[];
  /**
   * Why a session was thrown away. It lives here and not in a component because
   * saving navigates away from the session screen: kept in local state, the one
   * message that says a workout was lost would vanish with the screen.
   */
  rejected: string | null;
}

const EMPTY: WorkoutState = { draft: null, queue: [], rejected: null };

let state: WorkoutState | null = null;
const listeners = new Set<() => void>();

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function load(): WorkoutState {
  const device = storage();
  if (!device) {
    return EMPTY;
  }
  // A rejection is news from this page load; it is not worth remembering longer.
  return { draft: readDraft(device), queue: readQueue(device), rejected: null };
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): WorkoutState {
  if (state === null) {
    state = load();
  }
  return state;
}

/** Nothing is known while rendering on the server: the phone holds all of it. */
export function getServerSnapshot(): WorkoutState {
  return EMPTY;
}

function commit(next: WorkoutState): void {
  const device = storage();
  if (device) {
    if (next.draft) {
      saveDraft(device, next.draft);
    } else {
      clearDraft(device);
    }
    writeQueue(device, next.queue);
  }

  state = next;
  listeners.forEach((listener) => listener());
}

export function setDraft(draft: SessionDraft): void {
  commit({ ...getSnapshot(), draft });
}

export function discardDraft(): void {
  commit({ ...getSnapshot(), draft: null });
}

/** Finishing a session parks it and closes the draft in one step. */
export function queueSession(
  payload: WorkoutSessionInput,
  queuedAt: string,
): void {
  const current = getSnapshot();
  commit({
    draft: null,
    queue: enqueue(current.queue, payload, queuedAt),
    rejected: null,
  });
}

export function acknowledgeSession(deviceSessionId: string): void {
  const current = getSnapshot();
  commit({ ...current, queue: dequeue(current.queue, deviceSessionId) });
}

/** The session will never be accepted: it leaves the queue and this says why. */
export function rejectSession(deviceSessionId: string, reason: string): void {
  const current = getSnapshot();
  commit({
    ...current,
    queue: dequeue(current.queue, deviceSessionId),
    rejected: reason,
  });
}

export function dismissRejection(): void {
  commit({ ...getSnapshot(), rejected: null });
}
