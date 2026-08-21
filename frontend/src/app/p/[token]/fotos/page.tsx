import { PortalPhotosView } from "@/components/portal/portal-photos-view";

export default async function PortalPhotosPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PortalPhotosView token={token} />;
}
