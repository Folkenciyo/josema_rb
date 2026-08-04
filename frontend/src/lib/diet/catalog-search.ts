import type { MacroTotals } from "@/types/diet";

export type CatalogSort = "name" | "calories" | "calories_desc" | "protein";

/** Anything with a name and totals: meal templates and menus both qualify. */
interface NamedWithTotals {
  name: string;
  totals: MacroTotals;
}

/** Accent-insensitive so "platano" also finds "plátano". */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function matchesName(name: string, term: string): boolean {
  return normalize(name).includes(normalize(term.trim()));
}

export interface CatalogQuery {
  search: string;
  sort: CatalogSort;
  minCalories: string;
  maxCalories: string;
}

export const EMPTY_CATALOG_QUERY: CatalogQuery = {
  search: "",
  sort: "name",
  minCalories: "",
  maxCalories: "",
};

export function isCatalogQueryActive(query: CatalogQuery): boolean {
  return (
    query.search !== "" ||
    query.sort !== "name" ||
    query.minCalories !== "" ||
    query.maxCalories !== ""
  );
}

function compare<T extends NamedWithTotals>(sort: CatalogSort) {
  return (a: T, b: T): number => {
    switch (sort) {
      case "calories":
        return a.totals.calories - b.totals.calories;
      case "calories_desc":
        return b.totals.calories - a.totals.calories;
      case "protein":
        return b.totals.protein_g - a.totals.protein_g;
      default:
        return a.name.localeCompare(b.name, "es");
    }
  };
}

/** Filters by name and calorie range, then sorts. Never mutates the input. */
export function filterCatalog<T extends NamedWithTotals>(
  items: T[],
  query: CatalogQuery,
): T[] {
  const min = query.minCalories === "" ? null : Number(query.minCalories);
  const max = query.maxCalories === "" ? null : Number(query.maxCalories);

  return [...items]
    .filter((item) => {
      if (query.search && !matchesName(item.name, query.search)) return false;
      if (min !== null && item.totals.calories < min) return false;
      if (max !== null && item.totals.calories > max) return false;
      return true;
    })
    .sort(compare(query.sort));
}
