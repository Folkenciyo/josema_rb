/**
 * A deliberately tiny subset of markdown: paragraphs, bullet lists, bold and
 * italic. Nothing else — no links, no images, no raw HTML.
 *
 * The output is a tree, never a string of HTML: whoever renders it builds React
 * elements from it, so anything the trainer types is escaped by React itself and
 * there is no way to inject markup through the introduction.
 */

export interface TextSpan {
  text: string;
  bold: boolean;
  italic: boolean;
}

export type Block =
  | { kind: "paragraph"; spans: TextSpan[] }
  | { kind: "list"; items: TextSpan[][] };

const BULLET = /^\s*[-*]\s+/;
// Bold before italic: `**x**` must not be read as two italics.
const MARKS = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;

function span(text: string, bold = false, italic = false): TextSpan {
  return { text, bold, italic };
}

/** Splits one line into runs of plain, bold and italic text. */
export function parseInline(line: string): TextSpan[] {
  const spans: TextSpan[] = [];

  for (const piece of line.split(MARKS)) {
    if (!piece) {
      continue;
    }
    if (
      (piece.startsWith("**") && piece.endsWith("**")) ||
      (piece.startsWith("__") && piece.endsWith("__"))
    ) {
      spans.push(span(piece.slice(2, -2), true));
    } else if (
      (piece.startsWith("*") && piece.endsWith("*") && piece.length > 2) ||
      (piece.startsWith("_") && piece.endsWith("_") && piece.length > 2)
    ) {
      spans.push(span(piece.slice(1, -1), false, true));
    } else {
      spans.push(span(piece));
    }
  }

  return spans.length > 0 ? spans : [span(line)];
}

/**
 * Splits the text into paragraphs and lists. A blank line ends a block, and a
 * run of lines starting with `-` or `*` becomes one list.
 */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let items: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      // Single newlines inside a paragraph read as one flowing sentence.
      blocks.push({ kind: "paragraph", spans: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (items.length > 0) {
      blocks.push({ kind: "list", items: items.map(parseInline) });
      items = [];
    }
  };

  for (const rawLine of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();

    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }

    if (BULLET.test(rawLine)) {
      flushParagraph();
      items.push(rawLine.replace(BULLET, ""));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}
