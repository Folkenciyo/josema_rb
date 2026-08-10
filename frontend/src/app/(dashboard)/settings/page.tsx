import type { Metadata } from "next";

import { InviteTemplatesView } from "@/components/settings/invite-templates-view";

export const metadata: Metadata = { title: "Ajustes · JOSEMA RB" };

export default function SettingsPage() {
  return <InviteTemplatesView />;
}
