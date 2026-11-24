"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * On a phone the dialog is the whole screen: no backdrop margin to waste, the
 * title and its close button stay on top while the form scrolls, and
 * `ModalActions` keeps the buttons that finish it at the bottom.
 */
export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-surface w-full max-w-2xl shadow-xl max-sm:min-h-full sm:rounded-xl"
      >
        <div className="max-sm:bg-surface flex items-center justify-between border-b border-slate-200 px-5 py-3 max-sm:sticky max-sm:top-0 max-sm:z-10 max-sm:py-1.5 max-sm:pr-2">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 max-sm:p-3"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/**
 * The row of buttons that closes a dialog's form. Under `sm` it sticks to the
 * bottom of the screen, so "Guardar" is in reach without scrolling to it.
 * Only for forms inside a `Modal`: on a page it would sit under the bottom bar.
 */
export function ModalActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-sm:bg-surface flex justify-end gap-2 max-sm:sticky max-sm:bottom-0 max-sm:-mx-5 max-sm:-mb-5 max-sm:border-t max-sm:border-slate-200 max-sm:px-5 max-sm:py-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}
