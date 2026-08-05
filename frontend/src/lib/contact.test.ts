import { toMailtoHref, toTelHref, toWhatsAppHref } from "./contact";

describe("toTelHref", () => {
  it("strips separators", () => {
    expect(toTelHref("600 12 34 56")).toBe("tel:600123456");
  });

  it("keeps the international prefix", () => {
    expect(toTelHref("+34 600 123 456")).toBe("tel:+34600123456");
  });

  it("returns null without a number", () => {
    expect(toTelHref(null)).toBeNull();
    expect(toTelHref("   ")).toBeNull();
  });
});

describe("toWhatsAppHref", () => {
  it("assumes Spain for a bare 9-digit number", () => {
    expect(toWhatsAppHref("600123456")).toBe("https://wa.me/34600123456");
  });

  it("keeps an explicit country code", () => {
    expect(toWhatsAppHref("+351 912 345 678")).toBe("https://wa.me/351912345678");
    expect(toWhatsAppHref("34600123456")).toBe("https://wa.me/34600123456");
  });

  it("gives up instead of guessing an unknown country", () => {
    expect(toWhatsAppHref("12345")).toBeNull();
    expect(toWhatsAppHref(null)).toBeNull();
  });
});

describe("toMailtoHref", () => {
  it("trims the address", () => {
    expect(toMailtoHref(" ana@example.com ")).toBe("mailto:ana@example.com");
  });

  it("returns null without an address", () => {
    expect(toMailtoHref(null)).toBeNull();
    expect(toMailtoHref("")).toBeNull();
  });
});
