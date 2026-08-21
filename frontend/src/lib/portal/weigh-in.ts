/** Weights a person can plausibly type. Anything outside is a typo, not a weight. */
const MIN_WEIGHT_KG = 20;
const MAX_WEIGHT_KG = 400;

export type WeightParseResult =
  | { ok: true; weightKg: number }
  | { ok: false; error: string };

/**
 * Reads what a client types on a phone. A Spanish keyboard offers a comma for
 * decimals, so "80,5" has to mean the same as "80.5".
 */
export function parseWeightInput(raw: string): WeightParseResult {
  const cleaned = raw.trim().replace(",", ".");

  if (cleaned === "") {
    return { ok: false, error: "Escribe tu peso." };
  }

  const weightKg = Number(cleaned);

  if (!Number.isFinite(weightKg)) {
    return { ok: false, error: "Escribe solo números, por ejemplo 80,5." };
  }

  if (weightKg < MIN_WEIGHT_KG || weightKg > MAX_WEIGHT_KG) {
    return {
      ok: false,
      error: `El peso debe estar entre ${MIN_WEIGHT_KG} y ${MAX_WEIGHT_KG} kg.`,
    };
  }

  // One decimal is all a bathroom scale gives, and all the history stores.
  return { ok: true, weightKg: Math.round(weightKg * 10) / 10 };
}

/** A tape reading in centimetres. Blank is fine here: it means "not measured". */
const MAX_ZONE_CM = 300;

export type ZoneParseResult =
  | { ok: true; value: number | null }
  | { ok: false; error: string };

export function parseZoneInput(raw: string): ZoneParseResult {
  const cleaned = raw.trim().replace(",", ".");

  if (cleaned === "") {
    return { ok: true, value: null };
  }

  const value = Number(cleaned);

  if (!Number.isFinite(value)) {
    return { ok: false, error: "Escribe solo números, por ejemplo 86,5." };
  }

  if (value <= 0 || value > MAX_ZONE_CM) {
    return { ok: false, error: `Escribe una medida entre 1 y ${MAX_ZONE_CM} cm.` };
  }

  return { ok: true, value: Math.round(value * 10) / 10 };
}
