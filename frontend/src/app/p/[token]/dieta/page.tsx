import { PortalDietView } from "@/components/portal/portal-diet-view";

export default async function PortalDietPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PortalDietView token={token} />;
}
