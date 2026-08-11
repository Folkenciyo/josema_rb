import { localDateISO } from "./today";

describe("the date a session was trained", () => {
  it("is the day on the client's own clock, not in UTC", () => {
    // 23:30 in Madrid on the 11th is already the 12th in UTC.
    const lateEvening = new Date(2026, 7, 11, 23, 30);

    expect(localDateISO(lateEvening)).toBe("2026-08-11");
  });

  it("pads the month and the day", () => {
    expect(localDateISO(new Date(2026, 0, 5, 9, 0))).toBe("2026-01-05");
  });
});
