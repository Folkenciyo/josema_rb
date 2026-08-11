import type { MetadataRoute } from "next";

import { BACKGROUND_COLOR, PWA_ICONS, THEME_COLOR } from "@/lib/pwa/manifest";
import { portalPath } from "@/types/portal";

/**
 * One installable app per client link. The manifest has to be generated per token
 * because `start_url` and `id` carry it: without them the icon on the home screen
 * would open the app at a route the client has no access to.
 *
 * The token is not validated here on purpose — this only describes how to open a
 * link the client already has, and every portal call is authorized by the backend.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const home = portalPath(encodeURIComponent(token));

  const manifest: MetadataRoute.Manifest = {
    id: home,
    name: "Mi seguimiento · JOSEMA RB",
    short_name: "Mi seguimiento",
    description: "Tu rutina, tu dieta y tu peso",
    lang: "es",
    dir: "ltr",
    start_url: home,
    scope: home,
    display: "standalone",
    orientation: "portrait",
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: PWA_ICONS,
  };

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      // Private: the URL itself is the client's secret.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
