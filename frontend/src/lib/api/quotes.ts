import { api } from "./http";
import type { Quote, QuoteInput, QuotePin, QuoteQueue } from "@/types/quote";

/** Only the fields the trainer actually filled in are sent, so a PATCH with an
 *  untouched image field does not wipe the picture already stored. */
function toFormData(input: Partial<QuoteInput>): FormData {
  const formData = new FormData();

  if (input.text !== undefined) {
    formData.append("text", input.text);
  }
  if (input.author !== undefined) {
    formData.append("author", input.author);
  }
  if (input.mediaUrl) {
    formData.append("media_url", input.mediaUrl);
  }
  if (input.image) {
    formData.append("image", input.image);
  }
  if (input.clearMedia) {
    formData.append("clear_media", "true");
  }

  return formData;
}

export function listQuotes(): Promise<Quote[]> {
  return api.get<Quote[]>("/quotes");
}

export function createQuote(input: Partial<QuoteInput>): Promise<Quote> {
  return api.postForm<Quote>("/quotes", toFormData(input));
}

export function updateQuote(
  quoteId: string,
  input: Partial<QuoteInput>,
): Promise<Quote> {
  return api.patchForm<Quote>(`/quotes/${quoteId}`, toFormData(input));
}

export function deleteQuote(quoteId: string): Promise<void> {
  return api.delete<void>(`/quotes/${quoteId}`);
}

/** What is showing today and the days lined up behind it. */
export function getQuoteQueue(days = 7): Promise<QuoteQueue> {
  return api.get<QuoteQueue>(`/quotes/queue?days=${days}`);
}

export function showQuoteToday(quoteId: string): Promise<QuoteQueue> {
  return api.put<QuoteQueue>(`/quotes/${quoteId}/today`, {});
}

export function showQuoteNext(quoteId: string): Promise<QuoteQueue> {
  return api.put<QuoteQueue>(`/quotes/${quoteId}/next`, {});
}

export function reorderQuotes(quoteIds: string[]): Promise<QuoteQueue> {
  return api.put<QuoteQueue>("/quotes/queue/order", { quote_ids: quoteIds });
}

export function getPinnedQuote(clientId: string): Promise<QuotePin> {
  return api.get<QuotePin>(`/quotes/pinned/${clientId}`);
}

export function setPinnedQuote(
  clientId: string,
  quoteId: string | null,
): Promise<QuotePin> {
  return api.put<QuotePin>(`/quotes/pinned/${clientId}`, {
    quote_id: quoteId,
  });
}
