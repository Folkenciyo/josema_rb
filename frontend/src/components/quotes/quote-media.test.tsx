import { render, screen } from "@testing-library/react";

import { QuoteMedia } from "./quote-media";
import type { Quote } from "@/types/quote";

function quote(overrides: Partial<Quote>): Quote {
  return {
    id: "q1",
    text: "Sigue",
    author: null,
    media_kind: "none",
    image_url: null,
    embed_url: null,
    created_at: "2026-08-14T09:00:00Z",
    position: 0,
    ...overrides,
  };
}

describe("QuoteMedia", () => {
  it("renders nothing for a text-only message", () => {
    const { container } = render(<QuoteMedia quote={quote({})} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("frames a YouTube short in an iframe pointing at the given embed", () => {
    render(
      <QuoteMedia
        quote={quote({
          media_kind: "youtube",
          embed_url: "https://www.youtube-nocookie.com/embed/abc123",
        })}
      />,
    );

    expect(screen.getByTitle("Vídeo motivacional")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/abc123",
    );
  });

  it("shows the picture for an image message", () => {
    render(
      <QuoteMedia
        quote={quote({
          media_kind: "image",
          image_url: "/static/quote-images/q1.jpg",
        })}
      />,
    );

    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "/static/quote-images/q1.jpg",
    );
  });

  /** A kind with no address is a half-written record, not something to frame. */
  it("renders nothing when the embed address is missing", () => {
    const { container } = render(
      <QuoteMedia quote={quote({ media_kind: "instagram" })} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
