"use client";

import { useRef } from "react";
import { Camera, Trash2 } from "lucide-react";

import { photoUrl } from "@/lib/api/photos";
import { POSE_LABELS, type Photo, type PhotoPose } from "@/types/photo";

interface PhotoSlotProps {
  pose: PhotoPose;
  photo: Photo | null;
  isUploading: boolean;
  onPick: (file: File) => void;
  onDelete?: () => void;
}

/** One pose of one session: shows the shot, or an empty frame inviting an upload. */
export function PhotoSlot({
  pose,
  photo,
  isUploading,
  onPick,
  onDelete,
}: PhotoSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {POSE_LABELS[pose]}
        </span>
        {photo && onDelete && (
          <button
            type="button"
            title={`Borrar foto ${POSE_LABELS[pose].toLowerCase()}`}
            onClick={onDelete}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-3.5" />
            <span className="sr-only">Borrar foto</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 disabled:opacity-60"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by our own authenticated endpoint
          <img
            src={photoUrl(photo.id, { thumbnail: true })}
            alt={`${POSE_LABELS[pose]} del ${photo.taken_on}`}
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-1 text-slate-400 group-hover:text-amber-600">
            <Camera className="size-6" />
            <span className="text-xs">
              {isUploading ? "Subiendo…" : "Añadir"}
            </span>
          </span>
        )}
        {photo && (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs text-white opacity-0 group-hover:opacity-100">
            Reemplazar
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onPick(file);
          }
          // Reset so picking the same file twice still fires a change.
          event.target.value = "";
        }}
      />
    </div>
  );
}
