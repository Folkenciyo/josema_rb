import { PortalHomeView } from "@/components/portal/portal-home-view";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PortalHomeView token={token} />;
}
