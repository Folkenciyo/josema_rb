import { PHOTO_POSES, type Photo, type PhotoPose } from "@/types/photo";
import type { Measurement } from "@/types/measurement";

/** All the photos taken on one day, one slot per pose. */
export interface PhotoSession {
  takenOn: string;
  photos: Record<PhotoPose, Photo | null>;
  count: number;
}

const EMPTY_SLOTS = (): Record<PhotoPose, Photo | null> => ({
  front: null,
  side: null,
  back: null,
});

/**
 * Groups the flat list the API returns into one session per date, newest first.
 * The input is never mutated.
 */
export function groupIntoSessions(photos: Photo[]): PhotoSession[] {
  const byDate = new Map<string, Record<PhotoPose, Photo | null>>();

  for (const photo of photos) {
    const slots = byDate.get(photo.taken_on) ?? EMPTY_SLOTS();
    slots[photo.pose] = photo;
    byDate.set(photo.taken_on, slots);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([takenOn, slots]) => ({
      takenOn,
      photos: slots,
      count: PHOTO_POSES.filter((pose) => slots[pose] !== null).length,
    }));
}

export interface ComparisonRow {
  pose: PhotoPose;
  before: Photo | null;
  after: Photo | null;
}

/**
 * Pairs two sessions pose by pose, so front faces front and side faces side.
 * Always returns the three rows: a missing shot is a visible gap, not a
 * silently shifted row.
 */
export function buildComparison(
  before: PhotoSession | null,
  after: PhotoSession | null,
): ComparisonRow[] {
  return PHOTO_POSES.map((pose) => ({
    pose,
    before: before?.photos[pose] ?? null,
    after: after?.photos[pose] ?? null,
  }));
}

/**
 * The weigh-in closest to a date, so a photo can be shown with the weight of
 * that day even when nobody stepped on the scale exactly then. Ties go to the
 * earlier one, which is the weigh-in that already existed when the photo was
 * taken.
 */
export function weightNearestTo(
  measurements: Measurement[],
  isoDate: string,
): Measurement | null {
  if (measurements.length === 0) {
    return null;
  }

  const target = Date.parse(isoDate);

  return measurements.reduce((closest, candidate) => {
    const candidateGap = Math.abs(Date.parse(candidate.measured_on) - target);
    const closestGap = Math.abs(Date.parse(closest.measured_on) - target);

    if (candidateGap !== closestGap) {
      return candidateGap < closestGap ? candidate : closest;
    }
    return candidate.measured_on < closest.measured_on ? candidate : closest;
  });
}

/** Kilos between two sessions, using the weigh-in nearest to each one. */
export function weightDeltaBetween(
  measurements: Measurement[],
  beforeDate: string,
  afterDate: string,
): number | null {
  const before = weightNearestTo(measurements, beforeDate);
  const after = weightNearestTo(measurements, afterDate);

  if (!before || !after || before.id === after.id) {
    return null;
  }

  return Math.round((after.weight_kg - before.weight_kg) * 10) / 10;
}
