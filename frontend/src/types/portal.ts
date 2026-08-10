export interface PortalToken {
  client_id: string;
  portal_token: string | null;
  portal_token_issued_at: string | null;
}

/** What the client sees through their own link. Carries no client id by design. */
export interface PortalHome {
  full_name: string;
  goals: string | null;
  latest_weight_kg: number | null;
  latest_weighed_on: string | null;
}

export function portalPath(token: string): string {
  return `/p/${token}`;
}
