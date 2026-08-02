import type { Metadata } from "next";

import { ClientDetailView } from "@/components/clients/client-detail-view";

export const metadata: Metadata = { title: "Cliente · JOSEMA RB" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return <ClientDetailView clientId={clientId} />;
}
