import type { Metadata } from "next";

import { ClientsView } from "@/components/clients/clients-view";

export const metadata: Metadata = { title: "Clientes · JOSEMA RB" };

export default function ClientsPage() {
  return <ClientsView />;
}
