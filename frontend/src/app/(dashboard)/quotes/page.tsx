import type { Metadata } from "next";

import { QuotesView } from "@/components/quotes/quotes-view";

export const metadata: Metadata = { title: "Motivación · JOSEMA RB" };

export default function QuotesPage() {
  return <QuotesView />;
}
