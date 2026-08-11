import type { SessionDraft } from "./session-draft";
import type { WorkoutSessionInput } from "@/types/workout";

/**
 * A session is trained in a gym with no coverage and typed into a phone that may
 * lock, ring or run out of battery. So the draft lives in the device while it is
 * being trained, and finished sessions queue there until the server takes them.
 */
const DRAFT_KEY = "josema:workout-draft";
const QUEUE_KEY = "josema:workout-queue";
/** Older than this and it will be refused by the server anyway. */
const MAX_QUEUED = 30;

export interface PendingSession {
  payload: WorkoutSessionInput;
  queuedAt: string;
}

function readJson<T>(storage: Storage, key: string): T | null {
  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt entry: drop it rather than break every later read.
    storage.removeItem(key);
    return null;
  }
}

export function readDraft(storage: Storage): SessionDraft | null {
  return readJson<SessionDraft>(storage, DRAFT_KEY);
}

export function saveDraft(storage: Storage, draft: SessionDraft): void {
  storage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft(storage: Storage): void {
  storage.removeItem(DRAFT_KEY);
}

export function readQueue(storage: Storage): PendingSession[] {
  const queue = readJson<PendingSession[]>(storage, QUEUE_KEY);
  return Array.isArray(queue) ? queue : [];
}

export function writeQueue(storage: Storage, queue: PendingSession[]): void {
  storage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Queueing the same session twice replaces it: the phone id is what identifies it. */
export function enqueue(
  queue: PendingSession[],
  payload: WorkoutSessionInput,
  queuedAt: string,
): PendingSession[] {
  const others = queue.filter(
    (pending) =>
      pending.payload.device_session_id !== payload.device_session_id,
  );
  return [...others, { payload, queuedAt }].slice(-MAX_QUEUED);
}

export function dequeue(
  queue: PendingSession[],
  deviceSessionId: string,
): PendingSession[] {
  return queue.filter(
    (pending) => pending.payload.device_session_id !== deviceSessionId,
  );
}

/**
 * Whether a failed send is worth trying again. A rejected session — a date the
 * server will never accept, a routine that no longer exists — would fail the
 * same way forever, so it leaves the queue and the client is told.
 */
export function isWorthRetrying(status: number): boolean {
  return status === 0 || status === 429 || status >= 500;
}
