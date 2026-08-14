import type { MetadataRoute } from "next";

export const THEME_COLOR = "#8b1e24"; // brand-600, the accent from the guide
export const BACKGROUND_COLOR = "#f8fafc"; // slate-50, the app background

/** Shared by both installable apps, so trainer and client get the same icon set. */
export const PWA_ICONS: MetadataRoute.Manifest["icons"] = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
  {
    src: "/icons/icon-maskable-192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "maskable",
  },
  {
    src: "/icons/icon-maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];
