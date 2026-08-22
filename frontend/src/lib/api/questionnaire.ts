import { api } from "./http";
import type {
  ClientProfileInput,
  ClientQuestionnaire,
  PortalQuestionnaire,
  Questionnaire,
  QuestionInput,
} from "@/types/questionnaire";

export function getQuestionnaire(): Promise<Questionnaire> {
  return api.get<Questionnaire>("/settings/questionnaire");
}

/** Replaces the whole questionnaire — intro included — in the order given. */
export function setQuestionnaire(
  questions: QuestionInput[],
  intro: string | null,
): Promise<Questionnaire> {
  return api.put<Questionnaire>("/settings/questionnaire", { questions, intro });
}

export function getClientQuestionnaire(
  clientId: string,
): Promise<ClientQuestionnaire> {
  return api.get<ClientQuestionnaire>(`/clients/${clientId}/questionnaire`);
}

/** Portal side: no session, the token is the key. */
export function getPortalQuestionnaire(
  token: string,
): Promise<PortalQuestionnaire> {
  return api.get<PortalQuestionnaire>(`/portal/${token}/questionnaire`);
}

/** The file block travels whole every time, answers or no answers. */
export function submitPortalQuestionnaire(
  token: string,
  answers: { question_id: string; answer: string | null }[],
  profile: ClientProfileInput,
): Promise<PortalQuestionnaire> {
  return api.put<PortalQuestionnaire>(`/portal/${token}/questionnaire`, {
    answers,
    profile,
  });
}
