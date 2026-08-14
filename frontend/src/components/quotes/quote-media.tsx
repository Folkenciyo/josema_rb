import { cn } from "@/lib/cn";
import type { Quote } from "@/types/quote";

/**
 * The picture or player that goes with a message.
 *
 * The `src` always comes from `embed_url`, which the backend builds from a
 * fixed template around a stored identifier — never from anything a trainer
 * typed. Videos are boxed to a phone-shaped column because both Shorts and
 * Reels are vertical, and a full-width 9:16 frame would push everything else
 * off the screen.
 */

// Height-first, not width-first: a full-width 9:16 frame is taller than the
// phone it opens on and pushes the rest of the home screen out of sight. Fixing
// the height and letting the width follow keeps the player to about half the
// screen, with the sections below it still visible.
const FRAME_CLASSES =
  "mx-auto aspect-[9/16] h-[min(50vh,420px)] w-auto overflow-hidden rounded-lg border border-slate-200 bg-slate-950";

export function QuoteMedia({
  quote,
  className,
}: {
  quote: Quote;
  className?: string;
}) {
  if (quote.media_kind === "image" && quote.image_url) {
    return (
      // Not next/image: these are uploads proxied from the backend at a size we
      // already control, and the optimizer would only add a hop.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={quote.image_url}
        alt=""
        loading="lazy"
        className={cn(
          "max-h-[45vh] w-full rounded-lg border border-slate-200 object-cover",
          className,
        )}
      />
    );
  }

  if (quote.media_kind === "youtube" && quote.embed_url) {
    return (
      <div className={cn(FRAME_CLASSES, className)}>
        <iframe
          src={quote.embed_url}
          title="Vídeo motivacional"
          loading="lazy"
          allow="accelerometer; encrypted-media; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="size-full border-0"
        />
      </div>
    );
  }

  if (quote.media_kind === "instagram" && quote.embed_url) {
    return (
      <div className={cn(FRAME_CLASSES, "bg-white", className)}>
        <iframe
          src={quote.embed_url}
          title="Reel motivacional"
          loading="lazy"
          scrolling="no"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="size-full border-0"
        />
      </div>
    );
  }

  return null;
}
