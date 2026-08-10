import { parseWeightInput } from "./weigh-in";

describe("parseWeightInput", () => {
  it("accepts the comma a Spanish keyboard types", () => {
    expect(parseWeightInput("80,5")).toEqual({ ok: true, weightKg: 80.5 });
    expect(parseWeightInput("80.5")).toEqual({ ok: true, weightKg: 80.5 });
  });

  it("ignores surrounding spaces", () => {
    expect(parseWeightInput("  74 ")).toEqual({ ok: true, weightKg: 74 });
  });

  it("rounds to the decimal a scale actually shows", () => {
    expect(parseWeightInput("80,47")).toEqual({ ok: true, weightKg: 80.5 });
  });

  it("asks for a number when there is none", () => {
    expect(parseWeightInput("")).toEqual({
      ok: false,
      error: "Escribe tu peso.",
    });
    expect(parseWeightInput("mucho")).toEqual({
      ok: false,
      error: "Escribe solo números, por ejemplo 80,5.",
    });
  });

  it("rejects weights that can only be a typo", () => {
    expect(parseWeightInput("8")).toMatchObject({ ok: false });
    expect(parseWeightInput("800")).toMatchObject({ ok: false });
  });
});
