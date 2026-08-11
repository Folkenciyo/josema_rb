import type { Metadata } from "next";

import { RoutinesView } from "@/components/training/routines-view";

export const metadata: Metadata = { title: "Rutinas · JOSEMA RB" };

export default function RoutinesPage() {
  return <RoutinesView />;
}
