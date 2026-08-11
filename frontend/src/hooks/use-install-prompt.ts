"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/** Chrome-only event that lets a page raise the install dialog itself. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeToDisplayMode(onChange: () => void): () => void {
  const media = window.matchMedia(STANDALONE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readStandalone(): boolean {
  const legacy = (navigator as Navigator & { standalone?: boolean }).standalone;
  // Safari added the media query only in iOS 16.4; older iPhones report `standalone`.
  return window.matchMedia(STANDALONE_QUERY).matches || legacy === true;
}

function readIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

const NEVER_CHANGES = () => () => {};

export interface InstallPrompt {
  /** Already installed and running from the home screen. */
  isStandalone: boolean;
  /** iOS never fires the install event: those users need the manual instructions. */
  isIOS: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<void>;
}

export function useInstallPrompt(): InstallPrompt {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  // Assume installed while rendering on the server: a banner that flashes in and
  // out on every load is worse than one that shows up a moment late.
  const isStandalone = useSyncExternalStore(
    subscribeToDisplayMode,
    readStandalone,
    () => true,
  );
  const isIOS = useSyncExternalStore(NEVER_CHANGES, readIOS, () => false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Hold the browser's own banner back; the page offers the button instead.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) {
      return;
    }

    await deferred.prompt();
    await deferred.userChoice;
    // The event cannot be replayed: the browser fires a fresh one if it applies.
    setDeferred(null);
  }, [deferred]);

  return {
    isStandalone,
    isIOS,
    canInstall: deferred !== null,
    promptInstall,
  };
}
