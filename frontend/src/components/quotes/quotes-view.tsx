"use client";

import { useState } from "react";
// lucide dropped its brand icons, so the badges use generic media glyphs.
import { CirclePlay, Film, Pencil, Plus, Trash2 } from "lucide-react";

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
  useQuotes,
  useUpdateQuote,
} from "@/hooks/use-quotes";
import type { Quote } from "@/types/quote";
import { QuoteForm } from "./quote-form";
import { QuoteMedia } from "./quote-media";

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
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();

  const handleDelete = (quote: Quote) => {
    if (window.confirm(`¿Eliminar el mensaje "${quote.text.slice(0, 40)}…"?`)) {
      deleteQuote.mutate(quote.id);
    }
  };

  return (
    <>
      <PageHeader
        title="Motivación"
        description="Tus mensajes para los clientes. Cada día ven uno distinto en su portal."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo mensaje
          </Button>
        }
      />

      <ErrorMessage error={error ?? deleteQuote.error} />

      {isPending ? (
        <LoadingState />
      ) : (quotes?.length ?? 0) > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {quotes!.map((quote) => (
            <Card key={quote.id} className="flex flex-col gap-3 p-4">
              {quote.media_kind !== "none" && <QuoteMedia quote={quote} />}

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
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
