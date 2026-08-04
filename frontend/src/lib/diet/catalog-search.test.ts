import {
  EMPTY_CATALOG_QUERY,
  filterCatalog,
  isCatalogQueryActive,
  matchesName,
} from "./catalog-search";
import { EMPTY_TOTALS } from "./meal-draft";

function item(name: string, calories: number, protein_g = 0) {
  return { name, totals: { ...EMPTY_TOTALS, calories, protein_g } };
}

const items = [
  item("Desayuno proteico", 500, 40),
  item("Almuerzo ligero", 300, 20),
  item("Cena de plátano", 800, 10),
];

describe("matchesName", () => {
  it("ignores accents and case", () => {
    expect(matchesName("Cena de plátano", "PLATANO")).toBe(true);
  });

  it("ignores surrounding spaces", () => {
    expect(matchesName("Desayuno proteico", "  proteico ")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesName("Almuerzo ligero", "cena")).toBe(false);
  });
});

describe("filterCatalog", () => {
  it("filters by name", () => {
    const result = filterCatalog(items, {
      ...EMPTY_CATALOG_QUERY,
      search: "almuerzo",
    });

    expect(result.map((entry) => entry.name)).toEqual(["Almuerzo ligero"]);
  });

  it("filters by calorie range", () => {
    const result = filterCatalog(items, {
      ...EMPTY_CATALOG_QUERY,
      minCalories: "400",
      maxCalories: "600",
    });

    expect(result.map((entry) => entry.name)).toEqual(["Desayuno proteico"]);
  });

  it("sorts by calories ascending and descending", () => {
    expect(
      filterCatalog(items, { ...EMPTY_CATALOG_QUERY, sort: "calories" }).map(
        (entry) => entry.totals.calories,
      ),
    ).toEqual([300, 500, 800]);

    expect(
      filterCatalog(items, { ...EMPTY_CATALOG_QUERY, sort: "calories_desc" }).map(
        (entry) => entry.totals.calories,
      ),
    ).toEqual([800, 500, 300]);
  });

  it("sorts by protein descending", () => {
    const result = filterCatalog(items, {
      ...EMPTY_CATALOG_QUERY,
      sort: "protein",
    });

    expect(result[0].name).toBe("Desayuno proteico");
  });

  it("does not mutate the original array", () => {
    const original = [...items];
    filterCatalog(items, { ...EMPTY_CATALOG_QUERY, sort: "calories_desc" });

    expect(items).toEqual(original);
  });
});

describe("isCatalogQueryActive", () => {
  it("is false for the default query", () => {
    expect(isCatalogQueryActive(EMPTY_CATALOG_QUERY)).toBe(false);
  });

  it("is true once any control is used", () => {
    expect(
      isCatalogQueryActive({ ...EMPTY_CATALOG_QUERY, maxCalories: "500" }),
    ).toBe(true);
  });
});
