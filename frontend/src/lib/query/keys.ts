export const queryKeys = {
  currentTrainer: ["auth", "me"] as const,
  alerts: ["alerts"] as const,
  inviteTemplates: ["settings", "invite-templates"] as const,
  clients: (includeInactive: boolean) => ["clients", { includeInactive }] as const,
  client: (clientId: string) => ["clients", clientId] as const,
  measurements: (clientId: string) => ["clients", clientId, "measurements"] as const,
  photos: (clientId: string) => ["clients", clientId, "photos"] as const,
  portalInvite: (clientId: string) => ["clients", clientId, "portal-invite"] as const,
  portalHome: (token: string) => ["portal", token] as const,
  portalTrainingPlan: (token: string) => ["portal", token, "training-plan"] as const,
  portalDietPlan: (token: string) => ["portal", token, "diet-plan"] as const,
  portalMeasurements: (token: string) => ["portal", token, "measurements"] as const,
};
