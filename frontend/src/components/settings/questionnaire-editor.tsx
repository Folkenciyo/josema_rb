"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";

import { useQuestionnaire, useSetQuestionnaire } from "@/hooks/use-questionnaire";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import {
  emptyDraft,
  moveDraft,
  toDraft,
  toRequest,
  validationError,
  type QuestionDraft,
} from "@/lib/questionnaire/draft";
import {
  QUESTION_KIND_LABELS,
  type Question,
  type QuestionKind,
} from "@/types/questionnaire";

const KINDS = Object.keys(QUESTION_KIND_LABELS) as QuestionKind[];
const SELECT_CLASSES =
  "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-amber-400";

function QuestionRow({
  draft,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  draft: QuestionDraft;
  index: number;
  total: number;
  onChange: (changes: Partial<QuestionDraft>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-col gap-2 px-5 py-4">
      <div className="flex items-start gap-2">
        <span className="mt-2 w-5 shrink-0 text-sm font-semibold text-slate-400">
          {index + 1}
        </span>
        <Input
          value={draft.text}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder="Escribe la pregunta"
          aria-label={`Pregunta ${index + 1}`}
        />
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Subir"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Bajar"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
          >
            <ChevronDown className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Quitar pregunta"
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pl-7">
        <select
          value={draft.kind}
          onChange={(event) =>
            onChange({ kind: event.target.value as QuestionKind })
          }
          aria-label="Tipo de respuesta"
          className={SELECT_CLASSES}
        >
          {KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {QUESTION_KIND_LABELS[kind]}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={draft.required}
            onChange={(event) => onChange({ required: event.target.checked })}
            className="size-4 accent-amber-500"
          />
          Obligatoria
        </label>
      </div>

      {draft.kind === "choice" && (
        <div className="pl-7">
          <Input
            value={draft.optionsLine}
            onChange={(event) => onChange({ optionsLine: event.target.value })}
            placeholder="Opciones separadas por comas: 2, 3, 4, 5 o más"
            aria-label="Opciones"
          />
        </div>
      )}

      <div className="pl-7">
        <Input
          value={draft.helpText}
          onChange={(event) => onChange({ helpText: event.target.value })}
          placeholder="Aclaración para el cliente (opcional)"
          aria-label="Aclaración"
        />
      </div>
    </li>
  );
}

export function QuestionnaireEditor() {
  const { data: questions, isPending, error } = useQuestionnaire();

  if (isPending) {
    return (
      <Card className="mt-6">
        <CardHeader title="Cuestionario inicial" />
        <LoadingState />
      </Card>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <ErrorMessage error={error} />
      </div>
    );
  }

  return <QuestionnaireForm key={questions.length} questions={questions} />;
}

function QuestionnaireForm({ questions }: { questions: Question[] }) {
  const saveQuestionnaire = useSetQuestionnaire();
  const [drafts, setDrafts] = useState<QuestionDraft[]>(() =>
    questions.length > 0 ? questions.map(toDraft) : [emptyDraft()],
  );

  const localError = validationError(drafts);

  const patch = (index: number, changes: Partial<QuestionDraft>) =>
    setDrafts(
      drafts.map((draft, position) =>
        position === index ? { ...draft, ...changes } : draft,
      ),
    );

  return (
    <Card className="mt-6">
      <CardHeader
        title="Cuestionario inicial"
        action={
          <span className="text-xs text-slate-400">
            Lo rellena el cliente desde su enlace
          </span>
        }
      />

      <ul className="divide-y divide-slate-100">
        {drafts.map((draft, index) => (
          <QuestionRow
            key={draft.key}
            draft={draft}
            index={index}
            total={drafts.length}
            onChange={(changes) => patch(index, changes)}
            onMove={(direction) => setDrafts(moveDraft(drafts, index, direction))}
            onRemove={() =>
              setDrafts(drafts.filter((_, position) => position !== index))
            }
          />
        ))}
      </ul>

      <div className="flex flex-col gap-3 px-5 py-4">
        <Button
          variant="secondary"
          className="self-start"
          onClick={() => setDrafts([...drafts, emptyDraft()])}
        >
          <Plus className="size-4" />
          Añadir pregunta
        </Button>

        {localError && <p className="text-sm text-red-600">{localError}</p>}
        <ErrorMessage error={saveQuestionnaire.error} />

        <div className="flex items-center gap-3">
          <Button
            onClick={() => saveQuestionnaire.mutate(toRequest(drafts))}
            loading={saveQuestionnaire.isPending}
            disabled={localError !== null}
          >
            <Save className="size-4" />
            Guardar cuestionario
          </Button>
          {saveQuestionnaire.isSuccess && !saveQuestionnaire.isPending && (
            <span className="text-sm text-emerald-600">Guardado.</span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Cambiar el cuestionario no toca lo que ya contestó nadie: cada respuesta
          guarda la pregunta tal y como se le hizo.
        </p>
      </div>
    </Card>
  );
}
