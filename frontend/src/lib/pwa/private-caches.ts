/**
 * Asks the offline worker to drop everything that was read while signed in.
 * Fire and forget on purpose: signing out must not wait on a worker, and a
 * browser without one has nothing cached to begin with.
 */
export function clearPrivateCaches(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.controller?.postMessage({
    type: "CLEAR_PRIVATE_CACHES",
  });
}
