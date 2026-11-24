import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BottomNav } from "./bottom-nav";

let pathname = "/dashboard";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

function show(onOpenMenu = jest.fn()) {
  render(<BottomNav onOpenMenu={onOpenMenu} />);
}

describe("BottomNav", () => {
  beforeEach(() => {
    pathname = "/dashboard";
  });

  it("puts the four screens of the day and the rest behind «Más»", () => {
    show();

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["Inicio", "Clientes", "Rutinas", "Dieta"],
    );
    expect(screen.getByRole("button", { name: "Más" })).toBeVisible();
  });

  it("opens the menu from «Más»", async () => {
    const onOpenMenu = jest.fn();
    show(onOpenMenu);

    await userEvent.click(screen.getByRole("button", { name: "Más" }));

    expect(onOpenMenu).toHaveBeenCalled();
  });

  // A task tab stays lit anywhere inside its group: Alimentos is Dieta.
  it("lights «Dieta» up while the trainer is in Alimentos", () => {
    pathname = "/foods";
    show();

    expect(screen.getByRole("link", { name: "Dieta" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps «Clientes» lit inside a client's training plan", () => {
    pathname = "/clients/c1/training-plans/p1";
    show();

    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
