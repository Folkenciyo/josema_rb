import { Card } from "@/components/ui/card";
import { QuoteMedia } from "@/components/quotes/quote-media";
import type { Quote } from "@/types/quote";

/**
 * The message that greets the client. It leads the home screen, so it is the
 * one card that carries the brand colour rather than the plain white of the
 * sections below it.
 */
export function PortalQuoteCard({ quote }: { quote: Quote }) {
  return (
    <Card className="border-brand-200 bg-brand-50 flex flex-col gap-3 px-5 py-4">
      {quote.media_kind !== "none" && <QuoteMedia quote={quote} />}

      <blockquote className="text-brand-900 text-lg leading-snug font-medium text-balance">
        «{quote.text}»
      </blockquote>

      {quote.author && (
        <footer className="text-brand-700 text-sm">— {quote.author}</footer>
      )}
    </Card>
  );
}
