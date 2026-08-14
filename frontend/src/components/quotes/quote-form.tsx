"use client";

import { useState } from "react";
import { ImagePlus, Link2, Trash2, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { Quote, QuoteInput } from "@/types/quote";
import { QuoteMedia } from "./quote-media";

type MediaChoice = "none" | "image" | "link";

const CHOICES: { value: MediaChoice; label: string; icon: typeof Type }[] = [
  { value: "none", label: "Solo texto", icon: Type },
  { value: "image", label: "Imagen", icon: ImagePlus },
  { value: "link", label: "Vídeo", icon: Link2 },
];

/** Which tab a quote being edited opens on. */
function initialChoice(quote?: Quote): MediaChoice {
  if (!quote || quote.media_kind === "none") {
    return "none";
  }
  return quote.media_kind === "image" ? "image" : "link";
}

export function QuoteForm({
  quote,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: {
  quote?: Quote;
  isSubmitting: boolean;
  error: unknown;
  onCancel: () => void;
  onSubmit: (input: Partial<QuoteInput>) => void;
}) {
  const [text, setText] = useState(quote?.text ?? "");
  const [author, setAuthor] = useState(quote?.author ?? "");
  const [choice, setChoice] = useState<MediaChoice>(initialChoice(quote));
  const [mediaUrl, setMediaUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const hasStoredMedia = Boolean(quote && quote.media_kind !== "none");
  // Editing and switching to "Solo texto" has to actively strip what was there.
  const clearMedia = hasStoredMedia && choice === "none";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      text,
      author,
      mediaUrl: choice === "link" ? mediaUrl : "",
      image: choice === "image" ? image : null,
      clearMedia,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Mensaje">
        {(props) => (
          <Textarea
            {...props}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="El dolor es temporal, el orgullo es para siempre."
            maxLength={500}
            required
            rows={3}
          />
        )}
      </Field>

      <Field label="Autor" hint="Opcional. Quién lo dijo, si viene de alguien.">
        {(props) => (
          <Input
            {...props}
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Lance Armstrong"
            maxLength={120}
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-slate-700">Acompañar con</p>
        <div className="flex gap-2">
          {CHOICES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setChoice(value)}
              aria-pressed={choice === value}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                choice === value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {choice === "image" && (
        <Field
          label="Imagen"
          hint={
            hasStoredMedia && quote?.media_kind === "image"
              ? "Elige un archivo solo si quieres sustituir la actual."
              : "JPG, PNG o WEBP, hasta 10 MB."
          }
        >
          {(props) => (
            <Input
              {...props}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              className="h-auto py-1.5 text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-sm"
            />
          )}
        </Field>
      )}

      {choice === "link" && (
        <Field
          label="Enlace del vídeo"
          hint="Pega un Short de YouTube o un Reel de Instagram. Se verá dentro del portal."
        >
          {(props) => (
            <Input
              {...props}
              type="url"
              value={mediaUrl}
              onChange={(event) => setMediaUrl(event.target.value)}
              placeholder="https://www.youtube.com/shorts/..."
            />
          )}
        </Field>
      )}

      {quote && quote.media_kind !== "none" && !clearMedia && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-500">
            Lo que hay ahora
          </p>
          <QuoteMedia quote={quote} />
        </div>
      )}

      {clearMedia && (
        <p className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
          <Trash2 className="size-3.5 shrink-0" />
          Al guardar se quitará la imagen o el vídeo que tenía.
        </p>
      )}

      <ErrorMessage error={error} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
