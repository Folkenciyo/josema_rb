import { PortalTrainingView } from "@/components/portal/portal-training-view";

export default async function PortalTrainingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PortalTrainingView token={token} />;
}
