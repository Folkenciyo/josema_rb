import { WorkoutSessionView } from "@/components/portal/workout/workout-session-view";

export default async function PortalWorkoutSessionPage({
  params,
}: {
  params: Promise<{ token: string; dayId: string }>;
}) {
  const { token, dayId } = await params;

  return <WorkoutSessionView token={token} dayId={dayId} />;
}
