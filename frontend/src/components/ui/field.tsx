"use client";

import { useId } from "react";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: (props: { id: string; "aria-invalid": boolean }) => React.ReactNode;
}

/** Wires a label, hint and validation message to any control via a generated id. */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error) })}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
