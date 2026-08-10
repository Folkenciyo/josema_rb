"use client";

import { useClientQuestionnaire } from "@/hooks/use-questionnaire";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate } from "@/lib/format";

export function QuestionnaireCard({ clientId }: { clientId: string }) {
  const { data: questionnaire } = useClientQuestionnaire(clientId);

  if (!questionnaire) {
    return null;
  }

  const answered = questionnaire.answers.filter((row) => row.answer);

  return (
    <Card>
      <CardHeader
        title="Cuestionario"
        action={
          questionnaire.completed_at ? (
            <span className="text-xs text-slate-400">
              Contestado el {formatDate(questionnaire.completed_at)}
            </span>
          ) : undefined
        }
      />
      {answered.length === 0 ? (
        <EmptyState
          title="Todavía sin contestar"
          description="Aparecerá aquí en cuanto lo rellene desde su enlace."
        />
      ) : (
        <dl className="divide-y divide-slate-100">
          {answered.map((row, index) => (
            <div key={`${row.question_text}-${index}`} className="px-5 py-3">
              <dt className="text-sm text-slate-500">{row.question_text}</dt>
              <dd className="whitespace-pre-line text-slate-800">{row.answer}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
