import type { Metadata } from "next";

import { DietPlanView } from "@/components/diet/diet-plan-view";

export const metadata: Metadata = { title: "Plan de dieta · JOSEMA RB" };

export default async function DietPlanPage({
  params,
}: {
  params: Promise<{ clientId: string; planId: string }>;
}) {
  const { clientId, planId } = await params;

  return <DietPlanView clientId={clientId} planId={planId} />;
}
