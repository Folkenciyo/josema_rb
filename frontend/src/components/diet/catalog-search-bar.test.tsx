import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EMPTY_CATALOG_QUERY } from "@/lib/diet/catalog-search";

import { CatalogSearchBar } from "./catalog-search-bar";

describe("CatalogSearchBar", () => {
  it("folds the filters behind a button that opens them", async () => {
    render(
      <CatalogSearchBar
        query={EMPTY_CATALOG_QUERY}
        onChange={jest.fn()}
        placeholder="Buscar comida"
      />,
    );

    const toggle = screen.getByRole("button", { name: /Filtros/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("counts the filters that are set, but not the search", () => {
    render(
      <CatalogSearchBar
        query={{
          ...EMPTY_CATALOG_QUERY,
          search: "pollo",
          minCalories: "300",
          sort: "protein",
        }}
        onChange={jest.fn()}
        placeholder="Buscar comida"
      />,
    );

    expect(screen.getByRole("button", { name: /Filtros/ })).toHaveTextContent(
      "Filtros2",
    );
  });
});
