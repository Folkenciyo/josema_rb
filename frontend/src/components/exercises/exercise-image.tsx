import { Dumbbell } from "lucide-react";

import { cn } from "@/lib/cn";
import { exerciseImageUrl } from "@/lib/exercise-image";

interface ExerciseImageProps {
  path: string | undefined;
  alt: string;
  className?: string;
  /**
   * Shown inside the placeholder — the muscle it works, usually. Part of the
   * catalogue has no photo (its media is not ours to redistribute), so a wall
   * of identical dumbbells would tell the trainer nothing.
   */
  fallbackLabel?: string;
}

/**
 * Plain `img` on purpose: the files are already sized JPGs served from the backend
 * through the same-origin proxy, so `next/image` optimization would add a sharp
 * dependency to the standalone container for no visible gain.
 */
export function ExerciseImage({
  path,
  alt,
  className,
  fallbackLabel,
}: ExerciseImageProps) {
  if (!path) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1 bg-slate-100 text-slate-300",
          className,
        )}
      >
        <Dumbbell className="size-8" />
        {fallbackLabel && (
          <span className="max-w-full truncate px-1 text-[10px] font-medium text-slate-400">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={exerciseImageUrl(path)}
      alt={alt}
      loading="lazy"
      className={cn("bg-slate-100 object-cover", className)}
    />
  );
}
