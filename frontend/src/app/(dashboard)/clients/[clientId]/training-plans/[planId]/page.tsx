import type { Metadata } from "next";

import { TrainingPlanView } from "@/components/training/training-plan-view";

export const metadata: Metadata = { title: "Plan de entrenamiento · JOSEMA RB" };

export default async function TrainingPlanPage({
  params,
}: {
  params: Promise<{ clientId: string; planId: string }>;
}) {
  const { clientId, planId } = await params;

  return <TrainingPlanView clientId={clientId} planId={planId} />;
}
