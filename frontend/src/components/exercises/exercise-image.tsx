import { Dumbbell } from "lucide-react";

import { cn } from "@/lib/cn";
import { exerciseImageUrl } from "@/lib/exercise-image";

interface ExerciseImageProps {
  path: string | undefined;
  alt: string;
  className?: string;
}

/**
 * Plain `img` on purpose: the files are already sized JPGs served from the backend
 * through the same-origin proxy, so `next/image` optimization would add a sharp
 * dependency to the standalone container for no visible gain.
 */
export function ExerciseImage({ path, alt, className }: ExerciseImageProps) {
  if (!path) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-slate-100 text-slate-300",
          className,
        )}
      >
        <Dumbbell className="size-8" />
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
