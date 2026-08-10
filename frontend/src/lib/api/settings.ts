import { api } from "./http";
import type { InviteTemplates, InviteTemplatesInput } from "@/types/settings";

export function getInviteTemplates(): Promise<InviteTemplates> {
  return api.get<InviteTemplates>("/settings/invite-templates");
}

/** Sending a field empty restores the stock wording for that channel. */
export function updateInviteTemplates(
  input: InviteTemplatesInput,
): Promise<InviteTemplates> {
  return api.put<InviteTemplates>("/settings/invite-templates", input);
}
