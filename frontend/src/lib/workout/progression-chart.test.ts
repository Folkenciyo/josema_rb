import {
  buildProgressionGeometry,
  progressionDelta,
} from "./progression-chart";
import type { ExercisePoint } from "@/types/workout";

let counter = 0;

function point(
  performed_on: string,
  top_weight_kg: number | null,
): ExercisePoint {
  counter += 1;
  return {
    session_id: `session-${counter}`,
    performed_on,
    top_weight_kg,
    top_reps: 8,
    total_volume_kg: 0,
  };
}

describe("the progression line", () => {
  it("needs two sessions before there is anything to draw", () => {
    expect(
      buildProgressionGeometry([point("2026-08-01", 60)], 300, 80),
    ).toBeNull();
  });

  it("draws two sessions of the same day as two points", () => {
    // A double session: same date, two things to compare. Grouping by date used
    // to leave one point here and the chart said there was nothing to draw.
    const geometry = buildProgressionGeometry(
      [point("2026-08-21", 60), point("2026-08-21", 70)],
      300,
      80,
    );

    expect(geometry?.points).toHaveLength(2);
    expect(geometry?.minWeight).toBe(60);
    expect(geometry?.maxWeight).toBe(70);
  });

  it("puts the first session on the left and the last on the right", () => {
    const geometry = buildProgressionGeometry(
      [point("2026-08-01", 60), point("2026-08-08", 65)],
      300,
      80,
    );

    expect(geometry?.points[0].x).toBe(0);
    expect(geometry?.points[1].x).toBe(300);
    // The heaviest session sits at the top of the box, the lightest at the bottom.
    expect(geometry!.points[0].y).toBeGreaterThan(geometry!.points[1].y);
  });

  it("leaves out sessions with no weight instead of dropping the line to zero", () => {
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
  it("compares the last session with the first", () => {
    expect(
      progressionDelta([point("2026-08-01", 60), point("2026-08-08", 67.5)]),
    ).toBe(7.5);
  });

  it("says nothing when there is only one session", () => {
    expect(progressionDelta([point("2026-08-01", 60)])).toBeNull();
  });
});
