import type { Metadata } from "next";

import { HelpIndexView } from "@/components/help/help-index-view";

export const metadata: Metadata = { title: "Guía de uso · JOSEMA RB" };

export default function HelpPage() {
  return <HelpIndexView />;
}
