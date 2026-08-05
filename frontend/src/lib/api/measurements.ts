import { api } from "./http";
import type { Measurement, MeasurementInput } from "@/types/measurement";

export function listMeasurements(clientId: string): Promise<Measurement[]> {
  return api.get<Measurement[]>(`/clients/${clientId}/measurements`);
}

export function createMeasurement(
  clientId: string,
  input: MeasurementInput,
): Promise<Measurement> {
  return api.post<Measurement>(`/clients/${clientId}/measurements`, input);
}

export function updateMeasurement(
  measurementId: string,
  input: Partial<MeasurementInput>,
): Promise<Measurement> {
  return api.patch<Measurement>(`/measurements/${measurementId}`, input);
}

export function deleteMeasurement(measurementId: string): Promise<void> {
  return api.delete<void>(`/measurements/${measurementId}`);
}
