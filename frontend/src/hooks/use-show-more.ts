import { useState } from "react";

interface ShowMore<T> {
  visible: T[];
  hasMore: boolean;
  remaining: number;
  showMore: () => void;
}

/**
 * Renders a long catalog a page at a time. `resetKey` is whatever describes
 * the current search: when it changes the list starts again from the top.
 */
export function useShowMore<T>(
  items: T[],
  resetKey: string,
  pageSize: number,
): ShowMore<T> {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Reset during render when the search changes, instead of in an effect.
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setVisibleCount(pageSize);
  }

  return {
    visible: items.slice(0, visibleCount),
    hasMore: items.length > visibleCount,
    remaining: Math.max(items.length - visibleCount, 0),
    showMore: () => setVisibleCount((current) => current + pageSize),
  };
}
