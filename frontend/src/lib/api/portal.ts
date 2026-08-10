import { api } from "./http";
import type { PortalHome, PortalToken } from "@/types/portal";

/** Issues the link, or replaces the previous one — the old token stops working. */
export function issuePortalToken(clientId: string): Promise<PortalToken> {
  return api.post<PortalToken>(`/clients/${clientId}/portal-token`, {});
}

export function revokePortalToken(clientId: string): Promise<PortalToken> {
  return api.delete<PortalToken>(`/clients/${clientId}/portal-token`);
}

/** The only call the client's own device makes. No session involved. */
export function getPortalHome(token: string): Promise<PortalHome> {
  return api.get<PortalHome>(`/portal/${token}`);
}
