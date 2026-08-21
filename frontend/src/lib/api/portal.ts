import { api } from "./http";
import type { WeighIn } from "@/types/measurement";
import type {
  PortalDietPlan,
  PortalHome,
  PortalInvite,
  PortalPhoto,
  PortalToken,
  PortalTrainingPlan,
} from "@/types/portal";
import type { ExerciseHistory, TrainedExercise } from "@/types/workout";

/** Issues the link, or replaces the previous one — the old token stops working. */
export function issuePortalToken(clientId: string): Promise<PortalToken> {
  return api.post<PortalToken>(`/clients/${clientId}/portal-token`, {});
}

export function revokePortalToken(clientId: string): Promise<PortalToken> {
  return api.delete<PortalToken>(`/clients/${clientId}/portal-token`);
}

/** The wording of the invitation is written by the backend, not here. */
export function getPortalInvite(clientId: string): Promise<PortalInvite> {
  return api.get<PortalInvite>(`/clients/${clientId}/portal-invite`);
}

/** The calls below are the ones the client's own device makes. No session involved. */
export function getPortalHome(token: string): Promise<PortalHome> {
  return api.get<PortalHome>(`/portal/${token}`);
}

export function getPortalTrainingPlan(
  token: string,
): Promise<PortalTrainingPlan> {
  return api.get<PortalTrainingPlan>(`/portal/${token}/training-plan`);
}

export function getPortalDietPlan(token: string): Promise<PortalDietPlan> {
  return api.get<PortalDietPlan>(`/portal/${token}/diet-plan`);
}

export function getPortalMeasurements(token: string): Promise<WeighIn[]> {
  return api.get<WeighIn[]>(`/portal/${token}/measurements`);
}

/** The only write the portal allows, and always dated today by the backend. */
export function recordPortalWeighIn(
  token: string,
  weightKg: number,
  notes: string | null = null,
): Promise<WeighIn> {
  return api.post<WeighIn>(`/portal/${token}/measurements`, {
    weight_kg: weightKg,
    notes,
  });
}

/** The client's say over their own photos: agree, take it back, or wipe them. */
export function grantPhotoConsent(token: string): Promise<PortalHome> {
  return api.post<PortalHome>(`/portal/${token}/photo-consent`, {});
}

export function withdrawPhotoConsent(token: string): Promise<PortalHome> {
  return api.delete<PortalHome>(`/portal/${token}/photo-consent`);
}

export function deleteOwnPhotos(token: string): Promise<PortalHome> {
  return api.delete<PortalHome>(`/portal/${token}/photos`);
}

/** The gallery answers 403 while the client has not agreed to keeping the photos. */
export function getPortalPhotos(token: string): Promise<PortalPhoto[]> {
  return api.get<PortalPhoto[]>(`/portal/${token}/photos`);
}

/**
 * Same idea as the trainer's `photoUrl`, only the token is what authorises it:
 * a plain same-origin URL an <img> can load with no session at all.
 */
export function portalPhotoUrl(
  token: string,
  photoId: string,
  { thumbnail = false } = {},
): string {
  return `/api/portal/${token}/photos/${photoId}/file${thumbnail ? "?thumbnail=true" : ""}`;
}

export function getPortalTrainedExercises(
  token: string,
): Promise<TrainedExercise[]> {
  return api.get<TrainedExercise[]>(`/portal/${token}/trained-exercises`);
}

export function getPortalExerciseHistory(
  token: string,
  exerciseId: string,
): Promise<ExerciseHistory> {
  return api.get<ExerciseHistory>(
    `/portal/${token}/exercises/${exerciseId}/history`,
  );
}

export type PortalPlanKind = "training-plan" | "diet-plan";
export type ExportFormat = "pdf" | "docx";

/** Plain href: the browser downloads it straight, no fetch in between. */
export function portalExportHref(
  token: string,
  plan: PortalPlanKind,
  format: ExportFormat,
): string {
  return `/api/portal/${token}/${plan}/export/${format}`;
}
