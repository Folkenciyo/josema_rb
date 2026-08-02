import { api } from "./http";
import type { Client, ClientDetail, ClientInput } from "@/types/client";

export function listClients(includeInactive = false): Promise<Client[]> {
  return api.get<Client[]>(`/clients?include_inactive=${includeInactive}`);
}

export function getClient(clientId: string): Promise<ClientDetail> {
  return api.get<ClientDetail>(`/clients/${clientId}`);
}

export function createClient(input: ClientInput): Promise<Client> {
  return api.post<Client>("/clients", input);
}

export function updateClient(
  clientId: string,
  input: Partial<ClientInput>,
): Promise<Client> {
  return api.patch<Client>(`/clients/${clientId}`, input);
}

/** Soft delete — the backend keeps the client and its plan history. */
export function deactivateClient(clientId: string): Promise<Client> {
  return api.delete<Client>(`/clients/${clientId}`);
}
