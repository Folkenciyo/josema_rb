"use client";

import { useState } from "react";
// lucide dropped its brand icons, so the badges use generic media glyphs.
import {
  ArrowDown,
  ArrowUp,
  CirclePlay,
  Film,
  Pencil,
  Play,
  Plus,
  SkipForward,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import {
  useCreateQuote,
  useDeleteQuote,
  useQuoteQueue,
  useQuotes,
  useReorderQuotes,
  useShowQuoteNext,
  useShowQuoteToday,
  useUpdateQuote,
} from "@/hooks/use-quotes";
import { cn } from "@/lib/cn";
import type { Quote } from "@/types/quote";
import { QuoteForm } from "./quote-form";
import { QuoteMedia } from "./quote-media";
import { QuoteQueueCard } from "./quote-queue-card";

function MediaBadge({ quote }: { quote: Quote }) {
  if (quote.media_kind === "youtube") {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-500">
        <CirclePlay className="size-3.5" />
        Short de YouTube
      </span>
    );
  }
  if (quote.media_kind === "instagram") {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-500">
        <Film className="size-3.5" />
        Reel de Instagram
      </span>
    );
  }
  return null;
}

export function QuotesView() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);

  const { data: quotes, isPending, error } = useQuotes();
  const { data: queue } = useQuoteQueue(6);
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const showToday = useShowQuoteToday();
  const showNext = useShowQuoteNext();
  const reorder = useReorderQuotes();

  const todayId = queue?.today?.quote.id ?? null;
  const nextId = queue?.upcoming[0]?.quote.id ?? null;

  const handleDelete = (quote: Quote) => {
    if (window.confirm(`¿Eliminar el mensaje "${quote.text.slice(0, 40)}…"?`)) {
      deleteQuote.mutate(quote.id);
    }
  };

  /** Swaps a message with its neighbour and sends the whole queue back. */
  const move = (index: number, delta: number) => {
    if (!quotes) {
      return;
    }
    const target = index + delta;
    if (target < 0 || target >= quotes.length) {
      return;
    }
    const ids = quotes.map((quote) => quote.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };

  return (
    <>
      <PageHeader
        title="Motivación"
        description="Todos tus clientes leen el mismo mensaje cada día. Al día siguiente pasa al que va detrás en la cola."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo mensaje
          </Button>
        }
      />

      <ErrorMessage
        error={
          error ?? deleteQuote.error ?? reorder.error ?? showToday.error ??
          showNext.error
        }
      />

      <QuoteQueueCard />

      {isPending ? (
        <LoadingState />
      ) : (quotes?.length ?? 0) > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {quotes!.map((quote, index) => (
            <Card
              key={quote.id}
              className={cn(
                "flex flex-col gap-3 p-4",
                quote.id === todayId && "border-brand-500 ring-brand-100 ring-2",
              )}
            >
              {quote.media_kind !== "none" && <QuoteMedia quote={quote} />}

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {quote.id === todayId && (
                    <span className="bg-brand-600 mb-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      Hoy
                    </span>
                  )}
                  {quote.id === nextId && (
                    <span className="mb-1 inline-block rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      Mañana
                    </span>
                  )}
                  <p className="text-slate-800">«{quote.text}»</p>
                  {quote.author && (
                    <p className="mt-1 text-sm text-slate-500">
                      — {quote.author}
                    </p>
                  )}
                  <MediaBadge quote={quote} />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing(quote)}
                    aria-label="Editar mensaje"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(quote)}
                    aria-label="Eliminar mensaje"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => showToday.mutate(quote.id)}
                  disabled={quote.id === todayId}
                  title="Que todos lo lean hoy"
                >
                  <Play className="size-3.5" />
                  Hoy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => showNext.mutate(quote.id)}
                  disabled={quote.id === todayId || quote.id === nextId}
                  title="Ponerlo justo detrás del de hoy"
                >
                  <SkipForward className="size-3.5" />
                  El siguiente
                </Button>
                <span className="ml-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reorder.isPending}
                    aria-label="Subir en la cola"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(index, 1)}
                    disabled={
                      index === (quotes?.length ?? 0) - 1 || reorder.isPending
                    }
                    aria-label="Bajar en la cola"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Todavía no hay mensajes"
          description="Escribe el primero y tus clientes empezarán a verlo al abrir su portal."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Nuevo mensaje
            </Button>
          }
        />
      )}

      {isCreateOpen && (
        <Modal title="Nuevo mensaje" onClose={() => setCreateOpen(false)}>
          <QuoteForm
            isSubmitting={createQuote.isPending}
            error={createQuote.error}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(input) =>
              createQuote.mutate(input, {
                onSuccess: () => setCreateOpen(false),
              })
            }
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar mensaje" onClose={() => setEditing(null)}>
          <QuoteForm
            quote={editing}
            isSubmitting={updateQuote.isPending}
            error={updateQuote.error}
            onCancel={() => setEditing(null)}
            onSubmit={(input) =>
              updateQuote.mutate(
                { quoteId: editing.id, input },
                { onSuccess: () => setEditing(null) },
              )
            }
          />
        </Modal>
      )}
    </>
  );
}
