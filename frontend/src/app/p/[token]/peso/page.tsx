import { PortalWeightView } from "@/components/portal/portal-weight-view";

export default async function PortalWeightPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PortalWeightView token={token} />;
}
