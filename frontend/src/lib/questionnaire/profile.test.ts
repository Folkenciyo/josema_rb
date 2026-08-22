import {
  draftFromProfile,
  draftToProfileInput,
  missingProfileFields,
  type ProfileDraft,
} from "./profile";

const FILLED: ProfileDraft = {
  email: " elena@example.com ",
  phone: " +34 600 111 222 ",
  birth_date: "1990-05-02",
  sex: "female",
  height_cm: "168",
};

describe("draftFromProfile", () => {
  it("opens with what the trainer already knew, blanks for the rest", () => {
    const draft = draftFromProfile({
      email: null,
      phone: "600111222",
      birth_date: "1990-05-02",
      sex: null,
      height_cm: 168,
    });

    expect(draft).toEqual({
      email: "",
      phone: "600111222",
      birth_date: "1990-05-02",
      sex: "",
      height_cm: "168",
    });
  });
});

describe("missingProfileFields", () => {
  it("says nothing is missing once every box has something", () => {
    expect(missingProfileFields(FILLED)).toEqual([]);
  });

  it("names the empty boxes, whitespace included", () => {
    expect(
      missingProfileFields({ ...FILLED, email: "", height_cm: "   " }),
    ).toEqual(["Email", "Altura (cm)"]);
  });
});

describe("draftToProfileInput", () => {
  it("trims what was typed and turns the height into a number", () => {
    expect(draftToProfileInput(FILLED)).toEqual({
      email: "elena@example.com",
      phone: "+34 600 111 222",
      birth_date: "1990-05-02",
      sex: "female",
      height_cm: 168,
    });
  });

  it("reads a height written with a comma", () => {
    expect(
      draftToProfileInput({ ...FILLED, height_cm: "168,5" }).height_cm,
    ).toBe(168.5);
  });

  it("sends no height at all rather than a nonsense one", () => {
    expect(
      draftToProfileInput({ ...FILLED, height_cm: "alto" }).height_cm,
    ).toBeNull();
  });
});
