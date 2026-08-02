import { calculateAge, formatDate, formatDateRange } from "./format";

describe("formatDate", () => {
  it("formats an ISO day in Spanish without shifting the day by timezone", () => {
    expect(formatDate("2026-01-01")).toContain("01");
    expect(formatDate("2026-01-01")).toContain("2026");
  });

  it("renders a dash when there is no date", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatDateRange", () => {
  it("reports missing ranges explicitly", () => {
    expect(formatDateRange(null, null)).toBe("Sin fechas");
  });

  it("joins both ends of the range", () => {
    expect(formatDateRange("2026-01-01", "2026-02-01")).toContain("→");
  });
});

describe("calculateAge", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 2));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("returns null without a birth date", () => {
    expect(calculateAge(null)).toBeNull();
  });

  it("counts a birthday that already happened this year", () => {
    expect(calculateAge("1990-03-15")).toBe(36);
  });

  it("does not count a birthday still to come this year", () => {
    expect(calculateAge("1990-12-15")).toBe(35);
  });

  it("counts the birthday on the exact day", () => {
    expect(calculateAge("1990-08-02")).toBe(36);
  });
});
