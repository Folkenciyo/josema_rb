import type { SearchHit, SearchResults } from "@/types/search";

export interface PaletteItem {
  key: string;
  group: string;
  /** The row that carries the group heading, decided here so the list is pure. */
  startsGroup: boolean;
  label: string;
  detail: string | null;
  href: string;
}

/**
 * The palette is one flat list under group headings: arrows have to walk from
 * the last client into the first exercise without a special case per group.
 */
const GROUPS: {
  key: keyof SearchResults;
  title: string;
  href: (hit: SearchHit) => string;
}[] = [
  { key: "clients", title: "Clientes", href: (hit) => `/clients/${hit.id}` },
  {
    key: "exercises",
    title: "Ejercicios",
    href: (hit) => `/exercises/${hit.id}/edit`,
  },
  { key: "foods", title: "Alimentos", href: () => "/foods" },
  { key: "meals", title: "Comidas", href: () => "/meal-templates" },
  { key: "menus", title: "Menús", href: () => "/menus" },
];

export function flattenResults(
  results: SearchResults | undefined,
): PaletteItem[] {
  if (!results) {
    return [];
  }

  return GROUPS.flatMap(({ key, title, href }) =>
    results[key].map((hit, index) => ({
      key: `${key}:${hit.id}`,
      group: title,
      startsGroup: index === 0,
      label: hit.label,
      detail: hit.detail ?? null,
      href: href(hit),
    })),
  );
}

/** Wraps around, so holding the down arrow never dead-ends at the bottom. */
export function moveSelection(
  current: number,
  delta: number,
  total: number,
): number {
  if (total === 0) {
    return 0;
  }
  return (current + delta + total) % total;
}
