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

  it("prefills the draft when given a message", () => {
    expect(toWhatsAppHref("600123456", "Hola Ana: https://x.test/p/abc")).toBe(
      "https://wa.me/34600123456?text=Hola%20Ana%3A%20https%3A%2F%2Fx.test%2Fp%2Fabc",
    );
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

  it("carries subject and body, with real spaces and line breaks", () => {
    const href = toMailtoHref("ana@example.com", {
      subject: "Tu seguimiento personal",
      body: "Hola Ana:\n\nAquí tienes tu enlace.",
    });

    expect(href).toContain("subject=Tu%20seguimiento%20personal");
    expect(href).toContain("Hola%20Ana%3A%0A%0AAqu%C3%AD%20tienes");
    expect(href).not.toContain("+");
  });
});
