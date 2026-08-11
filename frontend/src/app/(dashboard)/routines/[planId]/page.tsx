import type { Metadata } from "next";

import { TrainingPlanView } from "@/components/training/training-plan-view";

export const metadata: Metadata = { title: "Rutina · JOSEMA RB" };

/** A template is a plan with no client, so it opens in the very same editor. */
export default async function RoutinePage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;

  return <TrainingPlanView planId={planId} />;
}
