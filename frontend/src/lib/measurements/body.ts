import { BODY_ZONE_KEYS, type BodyReading, type BodyZoneKey } from "@/types/measurement";

export const BODY_ZONE_LABELS: Record<BodyZoneKey, string> = {
  neck_cm: "Cuello",
  chest_cm: "Pecho",
  arm_right_cm: "Brazo derecho",
  arm_left_cm: "Brazo izquierdo",
  forearm_cm: "Antebrazo",
  waist_cm: "Cintura",
  hip_cm: "Cadera",
  thigh_cm: "Muslo",
  calf_cm: "Gemelo",
};

export const BODY_ZONES = BODY_ZONE_KEYS.map((key) => ({
  key,
  label: BODY_ZONE_LABELS[key],
}));

export function formatCentimetres(value: number): string {
  return `${value.toFixed(1).replace(".", ",")} cm`;
}

/** Signed, so "+1,5 cm" and "−2,0 cm" come out ready to print. */
export function formatCentimetreDelta(delta: number): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${Math.abs(delta).toFixed(1).replace(".", ",")} cm`;
}

export interface ZonePoint {
  id: string;
  measured_on: string;
  value: number;
}

/**
 * The readings of one zone, newest first like the API serves them, skipping the
 * days that zone was left blank. Nothing here reorders or mutates the input.
 */
export function zoneSeries(
  readings: readonly BodyReading[],
  zone: BodyZoneKey,
): ZonePoint[] {
  return readings.flatMap((reading) => {
    const value = reading[zone];
    return value === null || value === undefined
      ? []
      : [{ id: reading.id, measured_on: reading.measured_on, value }];
  });
}

/** The zones with at least one reading: the only ones worth offering a chart. */
export function measuredZones(readings: readonly BodyReading[]): BodyZoneKey[] {
  return BODY_ZONE_KEYS.filter((zone) =>
    readings.some((reading) => reading[zone] !== null),
  );
}

export interface ZoneProgress {
  latest: ZonePoint | null;
  /** Centimetres since the previous reading of this zone, not the previous day. */
  sincePrevious: number | null;
  sinceStart: number | null;
}

export function summarizeZone(
  readings: readonly BodyReading[],
  zone: BodyZoneKey,
): ZoneProgress {
  const series = zoneSeries(readings, zone);
  const [latest, previous] = series;
  const first = series[series.length - 1];

  if (!latest) {
    return { latest: null, sincePrevious: null, sinceStart: null };
  }

  return {
    latest,
    sincePrevious: previous ? round(latest.value - previous.value) : null,
    sinceStart:
      first && first.id !== latest.id ? round(latest.value - first.value) : null,
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
