import {
  buildComparison,
  groupIntoSessions,
  weightDeltaBetween,
  weightNearestTo,
} from "./sessions";
import type { Photo, PhotoPose } from "@/types/photo";
import type { Measurement } from "@/types/measurement";

function photo(id: string, takenOn: string, pose: PhotoPose): Photo {
  return {
    id,
    client_id: "c1",
    taken_on: takenOn,
    pose,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function measurement(id: string, measuredOn: string, weightKg: number): Measurement {
  return {
    id,
    client_id: "c1",
    measured_on: measuredOn,
    weight_kg: weightKg,
    notes: null,
    client_notes: null,
    bmi: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("groupIntoSessions", () => {
  const photos = [
    photo("p1", "2026-05-01", "front"),
    photo("p2", "2026-05-01", "back"),
    photo("p3", "2025-05-01", "front"),
    photo("p4", "2025-05-01", "side"),
    photo("p5", "2025-05-01", "back"),
  ];

  it("groups by date, newest first", () => {
    const sessions = groupIntoSessions(photos);

    expect(sessions.map((s) => s.takenOn)).toEqual(["2026-05-01", "2025-05-01"]);
  });

  it("counts only the poses that exist", () => {
    const sessions = groupIntoSessions(photos);

    expect(sessions[0].count).toBe(2);
    expect(sessions[0].photos.side).toBeNull();
    expect(sessions[1].count).toBe(3);
  });

  it("does not mutate the input", () => {
    const input = [...photos];
    groupIntoSessions(input);
    expect(input).toEqual(photos);
  });

  it("returns nothing for an empty list", () => {
    expect(groupIntoSessions([])).toEqual([]);
  });
});

describe("buildComparison", () => {
  it("pairs each pose with its counterpart", () => {
    const [older, newer] = groupIntoSessions([
      photo("p3", "2025-05-01", "front"),
      photo("p4", "2025-05-01", "side"),
      photo("p1", "2026-05-01", "front"),
    ]).reverse();

    const rows = buildComparison(older, newer);

    expect(rows.map((r) => r.pose)).toEqual(["front", "side", "back"]);
    expect(rows[0].before?.id).toBe("p3");
    expect(rows[0].after?.id).toBe("p1");
    // The 2026 session has no side shot: the gap stays visible.
    expect(rows[1].before?.id).toBe("p4");
    expect(rows[1].after).toBeNull();
    expect(rows[2].before).toBeNull();
    expect(rows[2].after).toBeNull();
  });

  it("survives a missing session", () => {
    expect(buildComparison(null, null)).toHaveLength(3);
  });
});

describe("weightNearestTo", () => {
  const measurements = [
    measurement("m3", "2026-05-10", 78),
    measurement("m2", "2026-04-01", 80),
    measurement("m1", "2025-05-02", 84),
  ];

  it("finds the closest weigh-in to a photo date", () => {
    expect(weightNearestTo(measurements, "2026-05-01")?.id).toBe("m3");
    expect(weightNearestTo(measurements, "2025-05-01")?.id).toBe("m1");
  });

  it("prefers the earlier weigh-in on a tie", () => {
    const tied = [
      measurement("after", "2026-05-11", 79),
      measurement("before", "2026-05-09", 81),
    ];

    expect(weightNearestTo(tied, "2026-05-10")?.id).toBe("before");
  });

  it("has nothing to return without weigh-ins", () => {
    expect(weightNearestTo([], "2026-05-01")).toBeNull();
  });
});

describe("weightDeltaBetween", () => {
  const measurements = [
    measurement("m3", "2026-05-10", 78),
    measurement("m1", "2025-05-02", 84),
  ];

  it("measures the change between two photo dates", () => {
    expect(weightDeltaBetween(measurements, "2025-05-01", "2026-05-01")).toBe(-6);
  });

  it("returns null when both dates land on the same weigh-in", () => {
    expect(weightDeltaBetween(measurements, "2026-05-09", "2026-05-11")).toBeNull();
  });
});
