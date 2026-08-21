import type { Metadata } from "next";

import { PortalNav } from "@/components/portal/portal-nav";
import { portalPath } from "@/types/portal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  const title = "Mi seguimiento · JOSEMA RB";
  const description = "Tu rutina, tu dieta y tu seguimiento";

  return {
    title,
    description,
    // A private link has no business showing up in a search engine.
    robots: { index: false, follow: false },
    // Not the trainer's manifest: this one starts the app on the client's own link.
    manifest: `${portalPath(token)}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: "Mi seguimiento" },
    // The preview a client sees when the link lands in their chat. Never the
    // client's name or anything of theirs: the brand and nothing else, because
    // whoever the link is forwarded to would see it too.
    openGraph: {
      type: "website",
      siteName: "JOSEMA RB",
      title,
      description,
      locale: "es_ES",
      images: [
        { url: "/brand/og-image.png", width: 1200, height: 630, alt: "JOSEMA RB" },
      ],
    },
    // Otherwise it inherits the trainer's wording and the same link says two
    // different things depending on where it is pasted.
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/brand/og-image.png"],
    },
  };
}

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <div className="flex-1">{children}</div>
      <PortalNav token={token} />
    </div>
  );
}
