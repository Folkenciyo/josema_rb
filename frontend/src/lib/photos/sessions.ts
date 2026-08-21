import { PHOTO_POSES, type Photo, type PhotoPose } from "@/types/photo";
import type { WeighIn } from "@/types/measurement";

/**
 * The little a photo needs for any of this: the trainer's `Photo` and the
 * portal's `PortalPhoto` — which carries no client id — both fit.
 */
export interface DatedPhoto {
  id: string;
  taken_on: string;
  pose: PhotoPose;
}

/** All the photos taken on one day, one slot per pose. */
export interface PhotoSession<T extends DatedPhoto = Photo> {
  takenOn: string;
  photos: Record<PhotoPose, T | null>;
  count: number;
}

const EMPTY_SLOTS = <T extends DatedPhoto>(): Record<PhotoPose, T | null> => ({
  front: null,
  side: null,
  back: null,
});

/**
 * Groups the flat list the API returns into one session per date, newest first.
 * The input is never mutated.
 */
export function groupIntoSessions<T extends DatedPhoto>(
  photos: T[],
): PhotoSession<T>[] {
  const byDate = new Map<string, Record<PhotoPose, T | null>>();

  for (const photo of photos) {
    const slots = byDate.get(photo.taken_on) ?? EMPTY_SLOTS<T>();
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

export interface ComparisonRow<T extends DatedPhoto = Photo> {
  pose: PhotoPose;
  before: T | null;
  after: T | null;
}

/**
 * Pairs two sessions pose by pose, so front faces front and side faces side.
 * Always returns the three rows: a missing shot is a visible gap, not a
 * silently shifted row.
 */
export function buildComparison<T extends DatedPhoto>(
  before: PhotoSession<T> | null,
  after: PhotoSession<T> | null,
): ComparisonRow<T>[] {
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
  measurements: WeighIn[],
  isoDate: string,
): WeighIn | null {
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
  measurements: WeighIn[],
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
