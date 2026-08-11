import { formatNumber, parseDecimal, parseWhole } from "./parse-number";

describe("numbers typed on a phone", () => {
  it("takes the comma the Spanish keyboard offers", () => {
    expect(parseDecimal("62,5")).toBe(62.5);
    expect(parseDecimal("62.5")).toBe(62.5);
  });

  it("reads an empty field as nothing, not as zero", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("   ")).toBeNull();
  });

  it("refuses what is not a weight", () => {
    expect(parseDecimal("mucho")).toBeNull();
    expect(parseDecimal("-20")).toBeNull();
  });

  it("keeps zero, which is a bar with no plates", () => {
    expect(parseDecimal("0")).toBe(0);
  });

  it("rounds repetitions, which come in whole units", () => {
    expect(parseWhole("8,6")).toBe(9);
  });

  it("shows the number back the way it was typed", () => {
    expect(formatNumber(62.5)).toBe("62,5");
    expect(formatNumber(null)).toBe("");
  });
});
