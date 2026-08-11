import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InstallCard } from "./install-card";

const ANDROID = "Mozilla/5.0 (Linux; Android 14) Chrome/126";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari";

function setUserAgent(value: string) {
  Object.defineProperty(navigator, "userAgent", {
    value,
    configurable: true,
  });
}

function setStandalone(matches: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
}

/** The event Chrome fires when the app meets the install criteria. */
function fireInstallable(prompt: jest.Mock) {
  const event = Object.assign(new Event("beforeinstallprompt"), {
    prompt,
    userChoice: Promise.resolve({ outcome: "accepted" as const }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
}

function renderCard() {
  render(<InstallCard title="Instálala" description="Estará a un toque." />);
}

describe("InstallCard", () => {
  beforeEach(() => {
    setUserAgent(ANDROID);
    setStandalone(false);
  });

  it("says nothing once the app runs from the home screen", () => {
    setStandalone(true);

    renderCard();

    expect(screen.queryByText("Instálala")).not.toBeInTheDocument();
  });

  it("stays out of the way on browsers that cannot install", () => {
    renderCard();

    expect(screen.queryByText("Instálala")).not.toBeInTheDocument();
  });

  it("offers the button once the browser reports the app is installable", async () => {
    const prompt = jest.fn().mockResolvedValue(undefined);
    renderCard();

    fireInstallable(prompt);
    await userEvent.click(screen.getByRole("button", { name: /instalar/i }));

    expect(prompt).toHaveBeenCalled();
  });

  it("explains the manual steps on iOS, which never fires the event", () => {
    setUserAgent(IPHONE);

    renderCard();

    expect(screen.getByText("Instálala")).toBeInTheDocument();
    expect(screen.getByText(/Añadir a pantalla de inicio/)).toBeInTheDocument();
  });
});
