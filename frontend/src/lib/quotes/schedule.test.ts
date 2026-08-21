import { dayLabel } from "./schedule";

describe("dayLabel", () => {
  const today = "2026-08-21"; // A Friday.

  it("names the two nearest days instead of dating them", () => {
    expect(dayLabel(today, today)).toBe("Hoy");
    expect(dayLabel("2026-08-22", today)).toBe("Mañana");
  });

  it("uses the weekday for the rest of the coming week", () => {
    expect(dayLabel("2026-08-23", today)).toBe("domingo");
    expect(dayLabel("2026-08-26", today)).toBe("miércoles");
  });

  it("falls back to a date once the week is over", () => {
    // Seven days out the weekday would be ambiguous: which Friday?
    expect(dayLabel("2026-08-28", today)).toMatch(/28/);
  });

  it("survives the end of a month", () => {
    expect(dayLabel("2026-09-01", "2026-08-31")).toBe("Mañana");
  });

  it("survives the spring daylight-saving jump", () => {
    // Spain moves the clock forward on 29 March 2026; a naive subtraction of
    // milliseconds would call that day "Hoy".
    expect(dayLabel("2026-03-29", "2026-03-28")).toBe("Mañana");
  });
});
