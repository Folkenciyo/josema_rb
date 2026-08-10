import type { QuestionInput, QuestionKind } from "@/types/questionnaire";

/** A question while it is being edited: options are typed as one line of text. */
export interface QuestionDraft {
  /** Local key, so React keeps its place while the question has no id yet. */
  key: string;
  text: string;
  helpText: string;
  kind: QuestionKind;
  optionsLine: string;
  required: boolean;
}

let nextKey = 0;

export function emptyDraft(): QuestionDraft {
  nextKey += 1;
  return {
    key: `q-${nextKey}`,
    text: "",
    helpText: "",
    kind: "short_text",
    optionsLine: "",
    required: false,
  };
}

export function toDraft(question: {
  text: string;
  help_text: string | null;
  kind: QuestionKind;
  options: string[] | null;
  required: boolean;
}): QuestionDraft {
  nextKey += 1;
  return {
    key: `q-${nextKey}`,
    text: question.text,
    helpText: question.help_text ?? "",
    kind: question.kind,
    optionsLine: (question.options ?? []).join(", "),
    required: question.required,
  };
}

export function parseOptions(optionsLine: string): string[] {
  return optionsLine
    .split(",")
    .map((option) => option.trim())
    .filter((option) => option !== "");
}

export function moveDraft(
  drafts: readonly QuestionDraft[],
  index: number,
  direction: -1 | 1,
): QuestionDraft[] {
  const target = index + direction;
  if (target < 0 || target >= drafts.length) {
    return [...drafts];
  }

  const moved = [...drafts];
  [moved[index], moved[target]] = [moved[target], moved[index]];
  return moved;
}

/** The blank ones are dropped: an empty question is a line nobody finished. */
export function toRequest(drafts: readonly QuestionDraft[]): QuestionInput[] {
  return drafts
    .filter((draft) => draft.text.trim() !== "")
    .map((draft) => ({
      text: draft.text.trim(),
      help_text: draft.helpText.trim() || null,
      kind: draft.kind,
      options: draft.kind === "choice" ? parseOptions(draft.optionsLine) : null,
      required: draft.required,
    }));
}

/** What the trainer has to fix before the questionnaire can be saved. */
export function validationError(
  drafts: readonly QuestionDraft[],
): string | null {
  const incomplete = drafts.find(
    (draft) =>
      draft.text.trim() !== "" &&
      draft.kind === "choice" &&
      parseOptions(draft.optionsLine).length === 0,
  );

  if (incomplete) {
    return `Escribe las opciones de "${incomplete.text.trim()}", separadas por comas.`;
  }

  return null;
}
