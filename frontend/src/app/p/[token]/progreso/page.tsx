import { PortalProgressView } from "@/components/portal/portal-progress-view";

export default async function PortalProgressPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PortalProgressView token={token} />;
}
