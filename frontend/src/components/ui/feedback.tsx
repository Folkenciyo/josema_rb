import { AlertCircle } from "lucide-react";

import { Spinner } from "./spinner";

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) {
    return null;
  }

  const message =
    error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
      <Spinner className="size-5 text-amber-500" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action}
    </div>
  );
}
