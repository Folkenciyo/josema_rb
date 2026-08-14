import Image from "next/image";

/**
 * The two marks from the brand guide. Both are metallic artwork on
 * transparency, so they read on the dark sidebar and on a white card alike —
 * the wordmark where there is room for it, the monogram where there is not.
 *
 * Callers size them and must set both dimensions (`h-7 w-auto`, `w-60 h-auto`):
 * `cn` here only joins strings, so a class left on by default would collide
 * rather than be overridden.
 */

const ALT = "JOSEMA RB";

export function BrandWordmark({
  className,
  preload = false,
}: {
  className?: string;
  preload?: boolean;
}) {
  return (
    <Image
      src="/brand/logo-wordmark.png"
      alt={ALT}
      width={1200}
      height={364}
      preload={preload}
      className={className}
    />
  );
}

export function BrandMonogram({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-monogram.png"
      alt={ALT}
      width={549}
      height={600}
      className={className}
    />
  );
}
