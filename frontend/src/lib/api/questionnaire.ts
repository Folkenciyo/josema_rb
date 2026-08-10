import { api } from "./http";
import type {
  ClientQuestionnaire,
  PortalQuestionnaire,
  Question,
  QuestionInput,
} from "@/types/questionnaire";

export function getQuestionnaire(): Promise<Question[]> {
  return api.get<Question[]>("/settings/questionnaire");
}

/** Replaces the whole questionnaire, in the order given. */
export function setQuestionnaire(questions: QuestionInput[]): Promise<Question[]> {
  return api.put<Question[]>("/settings/questionnaire", { questions });
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

export function submitPortalQuestionnaire(
  token: string,
  answers: { question_id: string; answer: string | null }[],
): Promise<PortalQuestionnaire> {
  return api.put<PortalQuestionnaire>(`/portal/${token}/questionnaire`, {
    answers,
  });
}
