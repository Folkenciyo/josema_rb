/**
 * Numbers typed on a phone in Spanish: the decimal key is a comma, and an empty
 * field means "not filled in", never zero.
 */
export function parseDecimal(value: string): number | null {
  const normalised = value.replace(",", ".").trim();
  if (normalised === "") {
    return null;
  }

  const parsed = Number(normalised);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function parseWhole(value: string): number | null {
  const parsed = parseDecimal(value);
  return parsed === null ? null : Math.round(parsed);
}

/** Back to the field: 62.5 reads as "62,5" to the person who typed it. */
export function formatNumber(value: number | null): string {
  return value === null ? "" : String(value).replace(".", ",");
}
