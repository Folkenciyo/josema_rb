import { parseBlocks, type TextSpan } from "@/lib/markdown/lite";
import { cn } from "@/lib/cn";

function Spans({ spans }: { spans: TextSpan[] }) {
  return (
    <>
      {spans.map((span, index) => {
        if (span.bold) {
          return <strong key={index}>{span.text}</strong>;
        }
        if (span.italic) {
          return <em key={index}>{span.text}</em>;
        }
        return <span key={index}>{span.text}</span>;
      })}
    </>
  );
}

/**
 * Renders the light markup as React nodes, never as HTML. Anything the author
 * typed that is not one of the four supported marks stays plain text, escaped
 * by React, so a paste from anywhere cannot bring markup with it.
 */
export function RichText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseBlocks(text);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2 text-slate-600", className)}>
      {blocks.map((block, index) =>
        block.kind === "paragraph" ? (
          <p key={index}>
            <Spans spans={block.spans} />
          </p>
        ) : (
          <ul
            key={index}
            className="list-disc space-y-1 pl-5 marker:text-slate-300"
          >
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <Spans spans={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
