import type { Metadata } from "next";

import { PortalNav } from "@/components/portal/portal-nav";

export const metadata: Metadata = {
  title: "Mi seguimiento · JOSEMA RB",
  // A private link has no business showing up in a search engine.
  robots: { index: false, follow: false },
};

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
