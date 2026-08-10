import {
  emptyDraft,
  moveDraft,
  parseOptions,
  toDraft,
  toRequest,
  validationError,
  type QuestionDraft,
} from "./draft";

function draftWith(changes: Partial<QuestionDraft>): QuestionDraft {
  return { ...emptyDraft(), ...changes };
}

describe("parseOptions", () => {
  it("splits on commas and drops the empties", () => {
    expect(parseOptions(" 2, 3 ,, 4 o más ,")).toEqual(["2", "3", "4 o más"]);
  });
});

describe("moveDraft", () => {
  const drafts = [
    draftWith({ text: "uno" }),
    draftWith({ text: "dos" }),
    draftWith({ text: "tres" }),
  ];

  it("swaps a question with its neighbour", () => {
    expect(moveDraft(drafts, 1, -1).map((d) => d.text)).toEqual([
      "dos",
      "uno",
      "tres",
    ]);
    expect(moveDraft(drafts, 1, 1).map((d) => d.text)).toEqual([
      "uno",
      "tres",
      "dos",
    ]);
  });

  it("does nothing at the ends", () => {
    expect(moveDraft(drafts, 0, -1).map((d) => d.text)).toEqual([
      "uno",
      "dos",
      "tres",
    ]);
    expect(moveDraft(drafts, 2, 1).map((d) => d.text)).toEqual([
      "uno",
      "dos",
      "tres",
    ]);
  });

  it("never mutates the list it is given", () => {
    const original = [...drafts];
    moveDraft(drafts, 0, 1);
    expect(drafts).toEqual(original);
  });
});

describe("toRequest", () => {
  it("drops the questions left blank", () => {
    const request = toRequest([
      draftWith({ text: "¿Lesiones?" }),
      draftWith({ text: "   " }),
    ]);

    expect(request).toHaveLength(1);
    expect(request[0].text).toBe("¿Lesiones?");
  });

  it("only sends options for a choice question", () => {
    const [choice] = toRequest([
      draftWith({ text: "¿Días?", kind: "choice", optionsLine: "2, 3, 4" }),
    ]);
    const [text] = toRequest([
      draftWith({ text: "¿Días?", kind: "short_text", optionsLine: "2, 3" }),
    ]);

    expect(choice.options).toEqual(["2", "3", "4"]);
    expect(text.options).toBeNull();
  });

  it("turns an empty help text into null", () => {
    const [question] = toRequest([draftWith({ text: "¿Edad?", helpText: "  " })]);

    expect(question.help_text).toBeNull();
  });
});

describe("validationError", () => {
  it("complains about a choice question with no options", () => {
    const error = validationError([
      draftWith({ text: "¿Días?", kind: "choice", optionsLine: " " }),
    ]);

    expect(error).toContain("¿Días?");
  });

  it("says nothing when everything is in order", () => {
    expect(
      validationError([
        draftWith({ text: "¿Días?", kind: "choice", optionsLine: "2, 3" }),
        draftWith({ text: "¿Lesiones?" }),
      ]),
    ).toBeNull();
  });

  it("ignores a blank line the trainer has not filled in yet", () => {
    expect(validationError([draftWith({ kind: "choice" })])).toBeNull();
  });
});

describe("toDraft", () => {
  it("brings a stored question back into the editor", () => {
    const draft = toDraft({
      text: "¿Días?",
      help_text: null,
      kind: "choice",
      options: ["2", "3"],
      required: true,
    });

    expect(draft.optionsLine).toBe("2, 3");
    expect(draft.helpText).toBe("");
    expect(draft.required).toBe(true);
  });
});
