export type QuoteMediaKind = "none" | "image" | "youtube" | "instagram";

export interface Quote {
  id: string;
  text: string;
  author: string | null;
  media_kind: QuoteMediaKind;
  /** Set when media_kind is "image". */
  image_url: string | null;
  /** Set for "youtube" and "instagram": the address the iframe loads. */
  embed_url: string | null;
  created_at: string;
}

export interface QuotePin {
  client_id: string;
  pinned_quote: Quote | null;
}

export interface QuoteInput {
  text: string;
  author: string;
  /** A pasted YouTube or Instagram link; the backend extracts the id. */
  mediaUrl: string;
  image: File | null;
  /** Strips whatever medium the quote had, leaving it text-only. */
  clearMedia: boolean;
}
