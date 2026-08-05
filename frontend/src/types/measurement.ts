export interface Measurement {
  id: string;
  client_id: string;
  measured_on: string;
  weight_kg: number;
  notes: string | null;
  /** Null until the client has a height on file. */
  bmi: number | null;
  created_at: string;
  updated_at: string;
}

export interface MeasurementInput {
  measured_on: string;
  weight_kg: number;
  notes?: string | null;
}
