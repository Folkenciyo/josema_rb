/**
 * Phone numbers are stored as the trainer types them ("600 12 34 56", "+34 600123456"),
 * so every outgoing link has to normalise them first.
 */

/** Spanish numbers are stored without a country code more often than not. */
const DEFAULT_COUNTRY_CODE = "34";
const LOCAL_NUMBER_LENGTH = 9;

function digitsOf(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** `tel:` keeps the leading `+` when the trainer typed one, and drops the rest. */
export function toTelHref(phone: string | null): string | null {
  if (!phone) {
    return null;
  }

  const digits = digitsOf(phone);
  if (digits === "") {
    return null;
  }

  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}

/**
 * wa.me only accepts a full international number, so a bare 9-digit number is
 * assumed to be Spanish. Anything else that lacks a country code is left out
 * rather than guessed wrong.
 *
 * `text` prefills the draft; WhatsApp still asks the trainer to press send.
 */
export function toWhatsAppHref(
  phone: string | null,
  text?: string,
): string | null {
  if (!phone) {
    return null;
  }

  const digits = digitsOf(phone);
  if (digits === "") {
    return null;
  }

  const query = text ? `?text=${encodeURIComponent(text)}` : "";

  if (phone.trim().startsWith("+") || digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    return `https://wa.me/${digits}${query}`;
  }

  if (digits.length === LOCAL_NUMBER_LENGTH) {
    return `https://wa.me/${DEFAULT_COUNTRY_CODE}${digits}${query}`;
  }

  return null;
}

export function toMailtoHref(
  email: string | null,
  message?: { subject: string; body: string },
): string | null {
  const trimmed = email?.trim();
  if (!trimmed) {
    return null;
  }

  if (!message) {
    return `mailto:${trimmed}`;
  }

  const query = new URLSearchParams({
    subject: message.subject,
    body: message.body,
  });
  // URLSearchParams encodes spaces as "+", which mail clients show literally.
  return `mailto:${trimmed}?${query.toString().replace(/\+/g, "%20")}`;
}
