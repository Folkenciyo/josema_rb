import type { Metadata } from "next";

import { ClientPhotosView } from "@/components/clients/client-photos-view";

export const metadata: Metadata = { title: "Fotos de progreso · JOSEMA RB" };

export default async function ClientPhotosPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return <ClientPhotosView clientId={clientId} />;
}
