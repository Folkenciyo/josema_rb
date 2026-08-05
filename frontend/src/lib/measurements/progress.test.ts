import {
  bmiCategory,
  buildChartGeometry,
  formatDelta,
  formatWeight,
  summarizeProgress,
} from "./progress";
import type { Measurement } from "@/types/measurement";

function measurement(
  id: string,
  measuredOn: string,
  weightKg: number,
): Measurement {
  return {
    id,
    client_id: "c1",
    measured_on: measuredOn,
    weight_kg: weightKg,
    notes: null,
    bmi: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

// Newest first, the order the API returns.
const series = [
  measurement("m3", "2026-08-01", 81),
  measurement("m2", "2026-07-01", 82.5),
  measurement("m1", "2026-06-01", 84),
];

describe("bmiCategory", () => {
  it("maps the WHO cut-offs", () => {
    expect(bmiCategory(17)).toBe("underweight");
    expect(bmiCategory(18.5)).toBe("normal");
    expect(bmiCategory(24.9)).toBe("normal");
    expect(bmiCategory(25)).toBe("overweight");
    expect(bmiCategory(30)).toBe("obese");
  });

  it("has nothing to say without a BMI", () => {
    expect(bmiCategory(null)).toBeNull();
  });
});

describe("summarizeProgress", () => {
  it("compares against the previous and the first weigh-in", () => {
    const progress = summarizeProgress(series);

    expect(progress.latest?.id).toBe("m3");
    expect(progress.sincePrevious).toBe(-1.5);
    expect(progress.sinceStart).toBe(-3);
  });

  it("has no deltas with a single weigh-in", () => {
    const progress = summarizeProgress([series[0]]);

    expect(progress.latest?.id).toBe("m3");
    expect(progress.sincePrevious).toBeNull();
    expect(progress.sinceStart).toBeNull();
  });

  it("handles an empty history", () => {
    expect(summarizeProgress([])).toEqual({
      latest: null,
      sincePrevious: null,
      sinceStart: null,
    });
  });

  it("does not mutate the input", () => {
    const input = [...series];
    summarizeProgress(input);
    expect(input).toEqual(series);
  });
});

describe("buildChartGeometry", () => {
  it("draws oldest to newest, left to right", () => {
    const geometry = buildChartGeometry(series, 100, 40);

    expect(geometry).not.toBeNull();
    expect(geometry!.points.map((p) => p.measurement.id)).toEqual([
      "m1",
      "m2",
      "m3",
    ]);
    expect(geometry!.points[0].x).toBe(0);
    expect(geometry!.points[2].x).toBe(100);
    expect(geometry!.minWeight).toBe(81);
    expect(geometry!.maxWeight).toBe(84);
    expect(geometry!.path.startsWith("M0 ")).toBe(true);
  });

  it("puts the heaviest point above the lightest", () => {
    const geometry = buildChartGeometry(series, 100, 40)!;

    // Lower y is higher on screen: the heaviest weigh-in must be on top.
    expect(geometry.points[0].y).toBeLessThan(geometry.points[2].y);
  });

  it("centres a flat series instead of dividing by zero", () => {
    const flat = [
      measurement("a", "2026-08-01", 80),
      measurement("b", "2026-07-01", 80),
    ];

    const geometry = buildChartGeometry(flat, 100, 40)!;

    expect(geometry.points.every((point) => point.y === 20)).toBe(true);
  });

  it("needs at least two points", () => {
    expect(buildChartGeometry([series[0]], 100, 40)).toBeNull();
    expect(buildChartGeometry([], 100, 40)).toBeNull();
  });
});

describe("formatting", () => {
  it("uses the Spanish decimal comma", () => {
    expect(formatWeight(81)).toBe("81,0 kg");
    expect(formatDelta(-1.5)).toBe("−1,5 kg");
    expect(formatDelta(1.5)).toBe("+1,5 kg");
    expect(formatDelta(0)).toBe("0,0 kg");
  });
});
