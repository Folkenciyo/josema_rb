import type { Metadata } from "next";

import { MenusView } from "@/components/diet/menus-view";

export const metadata: Metadata = { title: "Menús · JOSEMA RB" };

export default function MenusPage() {
  return <MenusView />;
}
