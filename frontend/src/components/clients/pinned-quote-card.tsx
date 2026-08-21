"use client";

import Link from "next/link";
import { Shuffle } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/feedback";
import { Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  usePinnedQuote,
  useQuotes,
  useSetPinnedQuote,
} from "@/hooks/use-quotes";

/** Enough of a message to recognise it in a dropdown. */
function summarize(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

export function PinnedQuoteCard({ clientId }: { clientId: string }) {
  const { data: quotes } = useQuotes();
  const { data: pin, isPending, error } = usePinnedQuote(clientId);
  const setPinned = useSetPinnedQuote(clientId);

  const library = quotes ?? [];

  return (
    <Card>
      <CardHeader
        title="Mensaje motivador"
        action={
          <Link
            href="/quotes"
            className="text-brand-700 text-sm font-medium hover:underline"
          >
            Ver biblioteca
          </Link>
        }
      />

      <div className="px-5 py-4">
        {isPending ? (
          <Spinner className="text-brand-600 size-5" />
        ) : library.length === 0 ? (
          <p className="text-sm text-slate-500">
            Todavía no hay mensajes en la biblioteca.{" "}
            <Link href="/quotes" className="text-brand-700 hover:underline">
              Escribe el primero
            </Link>
            .
          </p>
        ) : (
          <>
            <Select
              aria-label="Mensaje fijado"
              value={pin?.pinned_quote?.id ?? ""}
              disabled={setPinned.isPending}
              onChange={(event) => setPinned.mutate(event.target.value || null)}
            >
              <option value="">El de la cola de cada día (automático)</option>
              {library.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {summarize(quote.text)}
                </option>
              ))}
            </Select>

            <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
              <Shuffle className="mt-0.5 size-3.5 shrink-0" />
              {pin?.pinned_quote
                ? "Este cliente verá siempre este mensaje hasta que lo vuelvas a dejar en automático."
                : "Ve el mensaje que toque en la cola, igual que el resto. Elige uno para fijárselo solo a él."}
            </p>
          </>
        )}

        <ErrorMessage error={error ?? setPinned.error} />
      </div>
    </Card>
  );
}
