"use client";

import { useEffect, useRef, useState } from "react";

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditingField(): boolean {
  const active = document.activeElement;
  if (!active) {
    return false;
  }
  if (EDITABLE_TAGS.has(active.tagName)) {
    return true;
  }
  return active instanceof HTMLElement && active.isContentEditable;
}

/**
 * Registers the offline worker and reloads once a newer one takes over, so a
 * client stuck on an old shell (the PWA left open for days) picks up a deploy
 * without waiting for every tab to close by hand. Development is left out on
 * purpose: the worker would cache dev chunks and fight hot reload.
 */
export function ServiceWorkerRegistrar() {
  const [updateWaiting, setUpdateWaiting] = useState(false);
  const pendingReloadRef = useRef(false);

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

    let reloading = false;
    const reload = () => {
      if (reloading) {
        return;
      }
      reloading = true;
      window.location.reload();
    };

    // A reload mid-form would lose whatever the trainer has not saved yet, so
    // it waits until the field loses focus instead of cutting them off.
    const onControllerChange = () => {
      if (isEditingField()) {
        pendingReloadRef.current = true;
        setUpdateWaiting(true);
        return;
      }
      reload();
    };

    const onFocusOut = () => {
      if (!pendingReloadRef.current) {
        return;
      }
      // The element that receives focus next only does so after this event
      // finishes firing, so the check has to happen a tick later.
      setTimeout(() => {
        if (!isEditingField()) {
          reload();
        }
      }, 0);
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    document.addEventListener("focusout", onFocusOut, true);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      document.removeEventListener("focusout", onFocusOut, true);
    };
  }, []);

  if (!updateWaiting) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 bg-[#8B1E24] px-4 py-3 text-sm text-white shadow-lg">
      <span>Hay una actualización lista. Se aplicará al terminar de editar.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 rounded bg-white/15 px-3 py-1 font-medium hover:bg-white/25"
      >
        Actualizar ahora
      </button>
    </div>
  );
}
