import { api } from "./http";
import type { Photo, PhotoUpload } from "@/types/photo";

export function listPhotos(clientId: string): Promise<Photo[]> {
  return api.get<Photo[]>(`/clients/${clientId}/photos`);
}

export function uploadPhoto(
  clientId: string,
  { taken_on, pose, file }: PhotoUpload,
): Promise<Photo> {
  const formData = new FormData();
  formData.append("taken_on", taken_on);
  formData.append("pose", pose);
  formData.append("file", file);

  return api.postForm<Photo>(`/clients/${clientId}/photos`, formData);
}

export function deletePhoto(photoId: string): Promise<void> {
  return api.delete<void>(`/photos/${photoId}`);
}

/**
 * Body photos are served behind the session, so this is a plain same-origin URL
 * an <img> can load: the cookie rides along on its own.
 */
export function photoUrl(photoId: string, { thumbnail = false } = {}): string {
  return `/api/photos/${photoId}/file${thumbnail ? "?thumbnail=true" : ""}`;
}
