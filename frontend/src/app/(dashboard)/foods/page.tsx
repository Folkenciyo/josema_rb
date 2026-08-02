import type { Metadata } from "next";

import { FoodsView } from "@/components/diet/foods-view";

export const metadata: Metadata = { title: "Alimentos · JOSEMA RB" };

export default function FoodsPage() {
  return <FoodsView />;
}
