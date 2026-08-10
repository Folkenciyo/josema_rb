import { api } from "./http";
import type { WeighIn } from "@/types/measurement";
import type {
  PortalDietPlan,
  PortalHome,
  PortalToken,
  PortalTrainingPlan,
} from "@/types/portal";

/** Issues the link, or replaces the previous one — the old token stops working. */
export function issuePortalToken(clientId: string): Promise<PortalToken> {
  return api.post<PortalToken>(`/clients/${clientId}/portal-token`, {});
}

export function revokePortalToken(clientId: string): Promise<PortalToken> {
  return api.delete<PortalToken>(`/clients/${clientId}/portal-token`);
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
): Promise<WeighIn> {
  return api.post<WeighIn>(`/portal/${token}/measurements`, {
    weight_kg: weightKg,
  });
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
