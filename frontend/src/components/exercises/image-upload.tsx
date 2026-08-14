"use client";

import { useEffect, useMemo } from "react";
import { ImagePlus, X } from "lucide-react";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_EXERCISE_IMAGES,
  MAX_EXERCISE_IMAGE_BYTES,
} from "@/types/exercise";
import { ExerciseImage } from "./exercise-image";

interface ImageUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  existingImages?: string[];
  error?: string;
}

function useObjectUrls(files: File[]): string[] {
  const urls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(
    () => () => urls.forEach((url) => URL.revokeObjectURL(url)),
    [urls],
  );

  return urls;
}

export function ImageUpload({
  files,
  onChange,
  existingImages = [],
  error,
}: ImageUploadProps) {
  const previews = useObjectUrls(files);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    onChange([...files, ...selected].slice(0, MAX_EXERCISE_IMAGES));
    // Reset so picking the same file again still fires a change event.
    event.target.value = "";
  };

  const remove = (index: number) =>
    onChange(files.filter((_, position) => position !== index));

  const canAddMore = files.length < MAX_EXERCISE_IMAGES;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-slate-700">Fotos</p>

      {existingImages.length > 0 && files.length === 0 && (
        <div className="flex gap-2">
          {existingImages.map((path) => (
            <ExerciseImage
              key={path}
              path={path}
              alt="Imagen actual"
              className="size-24 rounded-lg"
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {previews.map((url, index) => (
          <div key={url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={files[index]?.name ?? "Imagen seleccionada"}
              className="size-24 rounded-lg bg-slate-100 object-cover"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Quitar ${files[index]?.name ?? "imagen"}`}
              className="bg-inverse absolute -top-2 -right-2 rounded-full p-1 text-white"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <label className="hover:border-brand-500 hover:text-brand-600 flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400">
            <ImagePlus className="size-5" />
            <span className="text-xs">Añadir</span>
            <input
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              multiple
              onChange={handleSelect}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Máximo {MAX_EXERCISE_IMAGES} fotos, JPG o PNG de hasta{" "}
        {MAX_EXERCISE_IMAGE_BYTES / (1024 * 1024)} MB.
        {existingImages.length > 0 &&
          " Si subes fotos nuevas, sustituyen a las actuales."}
      </p>

      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
