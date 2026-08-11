import type { Metadata } from "next";

import { PortalNav } from "@/components/portal/portal-nav";
import { portalPath } from "@/types/portal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  return {
    title: "Mi seguimiento · JOSEMA RB",
    // A private link has no business showing up in a search engine.
    robots: { index: false, follow: false },
    // Not the trainer's manifest: this one starts the app on the client's own link.
    manifest: `${portalPath(token)}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: "Mi seguimiento" },
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
