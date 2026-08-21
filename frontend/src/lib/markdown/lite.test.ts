import { parseBlocks, parseInline } from "./lite";

describe("parseInline", () => {
  it("leaves plain text alone", () => {
    expect(parseInline("Hola qué tal")).toEqual([
      { text: "Hola qué tal", bold: false, italic: false },
    ]);
  });

  it("reads bold and italic", () => {
    expect(parseInline("Vamos **a por ello** y *con calma*")).toEqual([
      { text: "Vamos ", bold: false, italic: false },
      { text: "a por ello", bold: true, italic: false },
      { text: " y ", bold: false, italic: false },
      { text: "con calma", bold: false, italic: true },
    ]);
  });

  it("does not read a double asterisk as two italics", () => {
    expect(parseInline("**fuerte**")).toEqual([
      { text: "fuerte", bold: true, italic: false },
    ]);
  });

  it("accepts underscores too", () => {
    expect(parseInline("__fuerte__ y _suave_")).toEqual([
      { text: "fuerte", bold: true, italic: false },
      { text: " y ", bold: false, italic: false },
      { text: "suave", bold: false, italic: true },
    ]);
  });

  it("keeps a lone asterisk as text instead of eating it", () => {
    expect(parseInline("2 * 3 = 6")).toEqual([
      { text: "2 * 3 = 6", bold: false, italic: false },
    ]);
  });

  it("never produces markup, only text", () => {
    // Whatever the trainer types stays text: the renderer builds React nodes,
    // so there is nothing here for a browser to execute.
    const spans = parseInline("<img src=x onerror=alert(1)>");

    expect(spans).toEqual([
      { text: "<img src=x onerror=alert(1)>", bold: false, italic: false },
    ]);
  });
});

describe("parseBlocks", () => {
  it("splits paragraphs on blank lines", () => {
    const blocks = parseBlocks("Primero.\n\nSegundo.");

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      kind: "paragraph",
      spans: [{ text: "Primero.", bold: false, italic: false }],
    });
  });

  it("joins the lines of one paragraph", () => {
    const blocks = parseBlocks("Una frase\ncortada en dos.");

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({
      kind: "paragraph",
      spans: [{ text: "Una frase cortada en dos.", bold: false, italic: false }],
    });
  });

  it("gathers consecutive bullets into one list", () => {
    const blocks = parseBlocks("Trae:\n- Agua\n- Toalla\n* Ganas");

    expect(blocks[0].kind).toBe("paragraph");
    expect(blocks[1]).toEqual({
      kind: "list",
      items: [
        [{ text: "Agua", bold: false, italic: false }],
        [{ text: "Toalla", bold: false, italic: false }],
        [{ text: "Ganas", bold: false, italic: false }],
      ],
    });
  });

  it("understands formatting inside a bullet", () => {
    const blocks = parseBlocks("- Trae **agua**");

    expect(blocks[0]).toEqual({
      kind: "list",
      items: [
        [
          { text: "Trae ", bold: false, italic: false },
          { text: "agua", bold: true, italic: false },
        ],
      ],
    });
  });

  it("survives windows line endings", () => {
    expect(parseBlocks("Uno.\r\n\r\nDos.")).toHaveLength(2);
  });

  it("gives nothing back for an empty text", () => {
    expect(parseBlocks("")).toEqual([]);
    expect(parseBlocks("   \n\n  ")).toEqual([]);
  });
});
