import { flattenResults, moveSelection } from "./results";
import type { SearchResults } from "@/types/search";

const EMPTY: SearchResults = {
  clients: [],
  exercises: [],
  foods: [],
  meals: [],
  menus: [],
};

describe("flattening the results", () => {
  it("keeps clients first: it is what the trainer looks for most", () => {
    const items = flattenResults({
      ...EMPTY,
      clients: [{ id: "c1", label: "Laura", detail: null }],
      exercises: [{ id: "e1", label: "Press banca", detail: "Pecho" }],
    });

    expect(items.map((item) => item.group)).toEqual(["Clientes", "Ejercicios"]);
    expect(items[0].href).toBe("/clients/c1");
    expect(items[1].href).toBe("/exercises/e1/edit");
  });

  it("survives having nothing to show", () => {
    expect(flattenResults(undefined)).toEqual([]);
    expect(flattenResults(EMPTY)).toEqual([]);
  });
});

describe("walking the list with the arrows", () => {
  it("wraps around instead of dead-ending", () => {
    expect(moveSelection(2, 1, 3)).toBe(0);
    expect(moveSelection(0, -1, 3)).toBe(2);
  });

  it("stays put when there is nothing to walk", () => {
    expect(moveSelection(0, 1, 0)).toBe(0);
  });
});
