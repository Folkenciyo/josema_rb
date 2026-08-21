export type QuestionKind =
  | "short_text"
  | "long_text"
  | "number"
  | "yes_no"
  | "choice";

export const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  short_text: "Respuesta corta",
  long_text: "Respuesta larga",
  number: "Número",
  yes_no: "Sí o no",
  choice: "Elegir una opción",
};

export interface Question {
  id: string;
  text: string;
  help_text: string | null;
  kind: QuestionKind;
  options: string[] | null;
  required: boolean;
  order_index: number;
}

export interface QuestionInput {
  text: string;
  help_text?: string | null;
  kind: QuestionKind;
  options?: string[] | null;
  required: boolean;
}

/** The questionnaire as the trainer edits it: the intro plus the questions. */
export interface Questionnaire {
  /** Null when the questionnaire opens straight into the first question. */
  intro: string | null;
  questions: Question[];
}

/** A question as the client sees it: with whatever they answered before. */
export interface PortalQuestion extends Question {
  answer: string | null;
}

export interface PortalQuestionnaire {
  intro: string | null;
  questions: PortalQuestion[];
  completed_at: string | null;
}

/** An answer as stored, carrying the wording it was asked with. */
export interface ClientAnswer {
  question_id: string | null;
  question_text: string;
  answer: string | null;
  order_index: number;
  answered_at: string | null;
}

export interface ClientQuestionnaire {
  answers: ClientAnswer[];
  completed_at: string | null;
}
