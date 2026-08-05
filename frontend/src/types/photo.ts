export type PhotoPose = "front" | "side" | "back";

/** Declaration order is the order they are shown side by side. */
export const PHOTO_POSES: readonly PhotoPose[] = ["front", "side", "back"];

export const POSE_LABELS: Record<PhotoPose, string> = {
  front: "Frontal",
  side: "Lateral",
  back: "Trasera",
};

export interface Photo {
  id: string;
  client_id: string;
  taken_on: string;
  pose: PhotoPose;
  created_at: string;
  updated_at: string;
}

export interface PhotoUpload {
  taken_on: string;
  pose: PhotoPose;
  file: File;
}
