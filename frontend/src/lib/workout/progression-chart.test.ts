import {
  buildProgressionGeometry,
  progressionDelta,
} from "./progression-chart";
import type { ExercisePoint } from "@/types/workout";

function point(
  performed_on: string,
  top_weight_kg: number | null,
): ExercisePoint {
  return {
    performed_on,
    top_weight_kg,
    top_reps: 8,
    total_volume_kg: 0,
  };
}

describe("the progression line", () => {
  it("needs two days before there is anything to draw", () => {
    expect(
      buildProgressionGeometry([point("2026-08-01", 60)], 300, 80),
    ).toBeNull();
  });

  it("puts the first day on the left and the last on the right", () => {
    const geometry = buildProgressionGeometry(
      [point("2026-08-01", 60), point("2026-08-08", 65)],
      300,
      80,
    );

    expect(geometry?.points[0].x).toBe(0);
    expect(geometry?.points[1].x).toBe(300);
    // The heaviest day sits at the top of the box, the lightest at the bottom.
    expect(geometry!.points[0].y).toBeGreaterThan(geometry!.points[1].y);
  });

  it("leaves out days with no weight instead of dropping the line to zero", () => {
    const geometry = buildProgressionGeometry(
      [
        point("2026-08-01", 60),
        point("2026-08-04", null),
        point("2026-08-08", 65),
      ],
      300,
      80,
    );

    expect(geometry?.points).toHaveLength(2);
  });

  it("draws a flat line down the middle when the weight never moved", () => {
    const geometry = buildProgressionGeometry(
      [point("2026-08-01", 60), point("2026-08-08", 60)],
      300,
      80,
    );

    expect(geometry?.points.map((item) => item.y)).toEqual([40, 40]);
  });
});

describe("how much the top set moved", () => {
  it("compares the last day with the first", () => {
    expect(
      progressionDelta([point("2026-08-01", 60), point("2026-08-08", 67.5)]),
    ).toBe(7.5);
  });

  it("says nothing when there is only one day", () => {
    expect(progressionDelta([point("2026-08-01", 60)])).toBeNull();
  });
});
