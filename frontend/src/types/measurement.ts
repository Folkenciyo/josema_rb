/**
 * The bare shape a weigh-in needs to be charted or compared. The client portal
 * serves exactly this and nothing else — no ids of its own, no trainer notes.
 */
export interface WeighIn {
  id: string;
  measured_on: string;
  weight_kg: number;
  /** Null until the client has a height on file. */
  bmi: number | null;
}

export interface Measurement extends WeighIn {
  client_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeasurementInput {
  measured_on: string;
  weight_kg: number;
  notes?: string | null;
}
