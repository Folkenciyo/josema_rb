import { measuredZones, summarizeZone, zoneSeries } from "./body";
import { BODY_ZONE_KEYS, type BodyReading } from "@/types/measurement";

function reading(
  id: string,
  measured_on: string,
  zones: Partial<Record<(typeof BODY_ZONE_KEYS)[number], number>>,
): BodyReading {
  const blanks = Object.fromEntries(BODY_ZONE_KEYS.map((key) => [key, null]));
  return { id, measured_on, notes: null, ...blanks, ...zones } as BodyReading;
}

// Newest first, the way the API serves them.
const READINGS: BodyReading[] = [
  reading("3", "2026-09-01", { waist_cm: 84 }),
  reading("2", "2026-08-01", { waist_cm: 85.5, chest_cm: 104 }),
  reading("1", "2026-07-01", { waist_cm: 88 }),
];

describe("zoneSeries", () => {
  it("skips the days that zone was left blank", () => {
    expect(zoneSeries(READINGS, "chest_cm")).toEqual([
      { id: "2", measured_on: "2026-08-01", value: 104 },
    ]);
  });

  it("leaves the input untouched", () => {
    const copy = [...READINGS];
    zoneSeries(READINGS, "waist_cm");
    expect(READINGS).toEqual(copy);
  });
});

describe("measuredZones", () => {
  it("offers only the zones with a reading", () => {
    expect(measuredZones(READINGS)).toEqual(["chest_cm", "waist_cm"]);
  });

  it("returns nothing when there are no readings at all", () => {
    expect(measuredZones([])).toEqual([]);
  });
});

describe("summarizeZone", () => {
  it("compares against the previous reading of that zone, not the previous day", () => {
    const progress = summarizeZone(READINGS, "waist_cm");

    expect(progress.latest?.value).toBe(84);
    expect(progress.sincePrevious).toBe(-1.5);
    expect(progress.sinceStart).toBe(-4);
  });

  it("has nothing to compare with a single reading", () => {
    const progress = summarizeZone(READINGS, "chest_cm");

    expect(progress.latest?.value).toBe(104);
    expect(progress.sincePrevious).toBeNull();
    expect(progress.sinceStart).toBeNull();
  });

  it("copes with a zone nobody ever measured", () => {
    expect(summarizeZone(READINGS, "calf_left_cm").latest).toBeNull();
  });
});
