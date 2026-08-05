export const queryKeys = {
  currentTrainer: ["auth", "me"] as const,
  clients: (includeInactive: boolean) => ["clients", { includeInactive }] as const,
  client: (clientId: string) => ["clients", clientId] as const,
  measurements: (clientId: string) => ["clients", clientId, "measurements"] as const,
};
