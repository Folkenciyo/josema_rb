import { api } from "./http";
import type {
  BodyMeasurement,
  BodyMeasurementInput,
  Measurement,
  MeasurementInput,
} from "@/types/measurement";

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

export function listBodyMeasurements(
  clientId: string,
): Promise<BodyMeasurement[]> {
  return api.get<BodyMeasurement[]>(`/clients/${clientId}/body-measurements`);
}

export function createBodyMeasurement(
  clientId: string,
  input: BodyMeasurementInput,
): Promise<BodyMeasurement> {
  return api.post<BodyMeasurement>(
    `/clients/${clientId}/body-measurements`,
    input,
  );
}

export function updateBodyMeasurement(
  measurementId: string,
  input: Partial<BodyMeasurementInput>,
): Promise<BodyMeasurement> {
  return api.patch<BodyMeasurement>(
    `/body-measurements/${measurementId}`,
    input,
  );
}

export function deleteBodyMeasurement(measurementId: string): Promise<void> {
  return api.delete<void>(`/body-measurements/${measurementId}`);
}
