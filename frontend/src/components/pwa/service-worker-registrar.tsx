"use client";

import { useEffect } from "react";

/**
 * Registers the offline worker. Development is left out on purpose: the worker
 * would cache dev chunks and fight hot reload.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        // Always revalidate the worker itself, or a stale one survives a deploy.
        updateViaCache: "none",
      })
      // A refusal means no workers here (private mode, insecure context). There is
      // nothing to recover from: the app simply stays online-only.
      .catch(() => {});
  }, []);

  return null;
}
