"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import {
  usePortalQuestionnaire,
  useSubmitPortalQuestionnaire,
} from "@/hooks/use-questionnaire";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { RichText } from "@/components/ui/rich-text";
import { formatDate } from "@/lib/format";
import { PortalPhotoConsent } from "./portal-photo-consent";
import type {
  PortalQuestion,
  PortalQuestionnaire,
} from "@/types/questionnaire";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "./portal-shell";

const TEXTAREA_CLASSES =
  "w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function AnswerField({
  question,
  value,
  onChange,
}: {
  question: PortalQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  if (question.kind === "long_text") {
    return (
      <textarea
        id={question.id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className={TEXTAREA_CLASSES}
      />
    );
  }

  if (question.kind === "yes_no") {
    return (
      <div className="flex gap-2">
        {["Sí", "No"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={
              value === option
                ? "bg-brand-600 rounded-lg px-4 py-1.5 text-sm font-semibold text-white"
                : "bg-surface rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600"
            }
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (question.kind === "choice") {
    return (
      <div className="flex flex-wrap gap-2">
        {(question.options ?? []).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={
              value === option
                ? "bg-brand-600 rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
                : "bg-surface rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600"
            }
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Input
      id={question.id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      inputMode={question.kind === "number" ? "decimal" : undefined}
    />
  );
}

function QuestionnaireForm({
  token,
  questionnaire,
}: {
  token: string;
  questionnaire: PortalQuestionnaire;
}) {
  const submit = useSubmitPortalQuestionnaire(token);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      questionnaire.questions.map((question) => [
        question.id,
        question.answer ?? "",
      ]),
    ),
  );

  const missing = questionnaire.questions.filter(
    (question) => question.required && !(answers[question.id] ?? "").trim(),
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submit.mutate(
      questionnaire.questions.map((question) => ({
        question_id: question.id,
        answer: answers[question.id] ?? null,
      })),
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {questionnaire.questions.map((question) => (
        <Card key={question.id} className="flex flex-col gap-2 px-5 py-4">
          <label htmlFor={question.id} className="font-medium text-slate-800">
            {question.text}
            {question.required && <span className="text-brand-600"> *</span>}
          </label>
          {question.help_text && (
            <p className="text-sm text-slate-500">{question.help_text}</p>
          )}
          <AnswerField
            question={question}
            value={answers[question.id] ?? ""}
            onChange={(value) =>
              setAnswers({ ...answers, [question.id]: value })
            }
          />
        </Card>
      ))}

      <ErrorMessage error={submit.error} />

      {submit.isSuccess && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600">
          <Check className="size-4" />
          Enviado. Tu entrenador ya lo ve.
        </p>
      )}

      <Button
        type="submit"
        loading={submit.isPending}
        disabled={missing.length > 0}
      >
        {questionnaire.completed_at ? "Guardar cambios" : "Enviar"}
      </Button>

      {missing.length > 0 && (
        <p className="text-center text-sm text-slate-500">
          Te falta contestar {missing.length}{" "}
          {missing.length === 1 ? "pregunta" : "preguntas"} obligatorias.
        </p>
      )}
    </form>
  );
}

export function PortalQuestionnaireView({ token }: { token: string }) {
  const {
    data: questionnaire,
    isPending,
    error,
  } = usePortalQuestionnaire(token);

  if (isPending) {
    return (
      <PortalPage>
        <PortalLoading />
      </PortalPage>
    );
  }

  if (error) {
    return (
      <PortalPage>
        <PortalHeader title="Cuestionario" />
        <PortalNotice
          title="Este enlace ya no sirve"
          description="Pídele a tu entrenador el enlace nuevo y vuelve a entrar."
        />
      </PortalPage>
    );
  }

  if (questionnaire.questions.length === 0) {
    return (
      <PortalPage>
        <PortalHeader title="Cuestionario" />
        <PortalNotice
          title="No hay nada que rellenar"
          description="Tu entrenador todavía no ha preparado ninguna pregunta."
        />
      </PortalPage>
    );
  }

  return (
    <PortalPage>
      <PortalHeader
        title="Cuestionario"
        subtitle={
          questionnaire.completed_at
            ? `Lo enviaste el ${formatDate(questionnaire.completed_at)}. Puedes cambiar lo que quieras.`
            : "Cuéntale a tu entrenador de dónde partes."
        }
      />
      {questionnaire.intro && (
        <Card className="px-5 py-4">
          <RichText text={questionnaire.intro} />
        </Card>
      )}
      <QuestionnaireForm token={token} questionnaire={questionnaire} />
      <PortalPhotoConsent token={token} />
    </PortalPage>
  );
}
