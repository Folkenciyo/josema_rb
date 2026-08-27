/**
 * A signal between two screens: the file where something was destroyed asks for
 * the burst, and the listing it lands on plays it.
 *
 * Deliberately in memory and nowhere else. The effect belongs to the click that
 * caused it, so it must not survive a reload the way a query parameter or
 * anything in storage would — landing on the listing hours later and being
 * greeted by an explosion would make no sense.
 *
 * Shaped as a store rather than a flag someone reads once: a screen subscribes
 * to it with `useSyncExternalStore`, which keeps reading it free of side
 * effects. What ends the burst is the animation finishing, not the reading.
 */
let pending = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function requestBurst(): void {
  pending = true;
  notify();
}

export function clearBurst(): void {
  pending = false;
  notify();
}

export function subscribeToBurst(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isBurstPending(): boolean {
  return pending;
}

/** Nothing ever explodes on the server, where there is no screen to paint on. */
export function noBurstOnServer(): boolean {
  return false;
}
