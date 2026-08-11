import type { MetadataRoute } from "next";

import { BACKGROUND_COLOR, PWA_ICONS, THEME_COLOR } from "@/lib/pwa/manifest";

/**
 * The trainer's app. The client installs a different one, generated per token at
 * `/p/[token]/manifest.webmanifest`, so both can live on the same phone.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "JOSEMA RB",
    short_name: "JOSEMA RB",
    description: "Planes de entrenamiento y dieta",
    lang: "es",
    dir: "ltr",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: PWA_ICONS,
  };
}
