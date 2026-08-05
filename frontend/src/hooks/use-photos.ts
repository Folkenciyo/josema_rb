"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as photosApi from "@/lib/api/photos";
import { queryKeys } from "@/lib/query/keys";
import type { PhotoUpload } from "@/types/photo";

export function usePhotos(clientId: string) {
  return useQuery({
    queryKey: queryKeys.photos(clientId),
    queryFn: () => photosApi.listPhotos(clientId),
  });
}

export function useUploadPhoto(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (upload: PhotoUpload) =>
      photosApi.uploadPhoto(clientId, upload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.photos(clientId) });
    },
  });
}

export function useDeletePhoto(clientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => photosApi.deletePhoto(photoId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.photos(clientId) });
    },
  });
}
