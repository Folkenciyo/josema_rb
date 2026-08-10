import type { Metadata } from "next";

import { PortalHomeView } from "@/components/portal/portal-home-view";

export const metadata: Metadata = {
  title: "Mi seguimiento · JOSEMA RB",
  // A private link has no business showing up in a search engine.
  robots: { index: false, follow: false },
};

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PortalHomeView token={token} />;
}
