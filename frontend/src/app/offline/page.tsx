import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Sin conexión · JOSEMA RB",
  robots: { index: false, follow: false },
};

/**
 * Served by the worker when a page is opened for the first time without coverage.
 * Anything already visited comes back from the cache instead of landing here.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <WifiOff className="size-6" />
      </span>
      <h1 className="text-xl font-bold text-slate-900">Estás sin conexión</h1>
      <p className="text-sm text-slate-500">
        No hemos podido cargar esta pantalla. Lo que ya habías abierto sigue
        disponible; vuelve a intentarlo cuando recuperes la cobertura.
      </p>
    </main>
  );
}
