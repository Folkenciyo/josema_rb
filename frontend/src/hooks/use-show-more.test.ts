import { act, renderHook } from "@testing-library/react";

import { useShowMore } from "./use-show-more";

const items = Array.from({ length: 45 }, (_, index) => index);

describe("useShowMore", () => {
  it("shows the first page and how many are left", () => {
    const { result } = renderHook(() => useShowMore(items, "", 20));

    expect(result.current.visible).toHaveLength(20);
    expect(result.current.remaining).toBe(25);
    expect(result.current.hasMore).toBe(true);
  });

  it("adds a page each time, and stops at the end", () => {
    const { result } = renderHook(() => useShowMore(items, "", 20));

    act(() => result.current.showMore());
    expect(result.current.visible).toHaveLength(40);

    act(() => result.current.showMore());
    expect(result.current.visible).toHaveLength(45);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.remaining).toBe(0);
  });

  it("goes back to the first page when the search changes", () => {
    const { result, rerender } = renderHook(
      ({ key }) => useShowMore(items, key, 20),
      { initialProps: { key: "" } },
    );

    act(() => result.current.showMore());
    rerender({ key: "pollo" });

    expect(result.current.visible).toHaveLength(20);
  });
});
