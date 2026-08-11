import { WorkoutDaysView } from "@/components/portal/workout/workout-days-view";

export default async function PortalWorkoutPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <WorkoutDaysView token={token} />;
}
