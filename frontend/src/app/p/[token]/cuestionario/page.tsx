import { PortalQuestionnaireView } from "@/components/portal/portal-questionnaire-view";

export default async function PortalQuestionnairePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PortalQuestionnaireView token={token} />;
}
