/**
 * The bare shape a weigh-in needs to be charted or compared. The client portal
 * serves exactly this and nothing else — no ids of its own.
 */
export interface WeighIn {
  id: string;
  measured_on: string;
  weight_kg: number;
  /** Null until the client has a height on file. */
  bmi: number | null;
  /** Whatever the client wrote down: body fat, water, what their scale said. */
  notes: string | null;
}

export interface Measurement extends WeighIn {
  client_id: string;
  /** The client's own observations. `notes` here is the trainer's private one. */
  client_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeasurementInput {
  measured_on: string;
  weight_kg: number;
  notes?: string | null;
}

/** The eleven tape spots, in the order every screen and document shows them. */
export const BODY_ZONE_KEYS = [
  "neck_cm",
  "chest_cm",
  "arm_right_cm",
  "arm_left_cm",
  "forearm_cm",
  "waist_cm",
  "hip_cm",
  "thigh_right_cm",
  "thigh_left_cm",
  "calf_right_cm",
  "calf_left_cm",
] as const;

export type BodyZoneKey = (typeof BODY_ZONE_KEYS)[number];

/** Every zone is nullable: measuring the waist without the calf is normal. */
export type BodyZones = { [K in BodyZoneKey]: number | null };

/** A day's tape readings as the client's portal serves them. */
export interface BodyReading extends BodyZones {
  id: string;
  measured_on: string;
  /** What the client wrote themselves, never the trainer's note. */
  notes: string | null;
}

export interface BodyMeasurement extends BodyReading {
  client_id: string;
  /** The client's own remarks. `notes` here is the trainer's private one. */
  client_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BodyMeasurementInput = Partial<BodyZones> & {
  measured_on: string;
  notes?: string | null;
};
