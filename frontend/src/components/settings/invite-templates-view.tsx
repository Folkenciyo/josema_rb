"use client";

import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";

import { useInviteTemplates, useUpdateInviteTemplates } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PLACEHOLDER_HINTS, type InviteTemplates } from "@/types/settings";

const TEXTAREA_CLASSES =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

function PlaceholderLegend({ placeholders }: { placeholders: string[] }) {
  return (
    <p className="text-sm text-slate-500">
      Puedes usar{" "}
      {placeholders.map((name, index) => (
        <span key={name}>
          {index > 0 && ", "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">
            {`{${name}}`}
          </code>{" "}
          para {PLACEHOLDER_HINTS[name] ?? name}
        </span>
      ))}
      . Se rellenan solos al enviar.
    </p>
  );
}

export function InviteTemplatesView() {
  const { data: templates, isPending, error } = useInviteTemplates();

  if (isPending) {
    return (
      <>
        <PageHeader title="Ajustes" />
        {error ? <ErrorMessage error={error} /> : <LoadingState />}
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Ajustes" />
        <ErrorMessage error={error} />
      </>
    );
  }

  return (
    // Keyed on the saved text so "restore the stock wording" refills the boxes.
    <TemplatesForm
      key={`${templates.whatsapp_template}|${templates.email_subject}|${templates.email_template}`}
      templates={templates}
    />
  );
}

function TemplatesForm({ templates }: { templates: InviteTemplates }) {
  const updateTemplates = useUpdateInviteTemplates();
  const [draft, setDraft] = useState<InviteTemplates>(templates);

  const patch = (changes: Partial<InviteTemplates>) =>
    setDraft({ ...draft, ...changes });

  const handleSave = () => {
    updateTemplates.mutate({
      whatsapp_template: draft.whatsapp_template,
      email_subject: draft.email_subject,
      email_template: draft.email_template,
    });
  };

  const handleRestore = () => {
    if (
      window.confirm(
        "Se recuperará el texto de fábrica de los dos mensajes. ¿Seguimos?",
      )
    ) {
      // Empty fields are how the backend spells "back to the stock text".
      updateTemplates.mutate({
        whatsapp_template: "",
        email_subject: "",
        email_template: "",
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Cómo se redacta el mensaje con el que entregas el enlace a tus clientes."
      />

      <Card>
        <CardHeader title="Mensaje del enlace" />
        <div className="flex flex-col gap-5 px-5 py-4">
          <PlaceholderLegend placeholders={draft.placeholders} />

          <Field label="WhatsApp" hint="Corto y directo: se lee en el móvil.">
            {({ id }) => (
              <textarea
                id={id}
                value={draft.whatsapp_template}
                onChange={(event) =>
                  patch({ whatsapp_template: event.target.value })
                }
                rows={5}
                className={TEXTAREA_CLASSES}
              />
            )}
          </Field>

          <Field label="Asunto del email">
            {({ id }) => (
              <Input
                id={id}
                value={draft.email_subject}
                onChange={(event) =>
                  patch({ email_subject: event.target.value })
                }
              />
            )}
          </Field>

          <Field label="Cuerpo del email">
            {({ id }) => (
              <textarea
                id={id}
                value={draft.email_template}
                onChange={(event) =>
                  patch({ email_template: event.target.value })
                }
                rows={10}
                className={TEXTAREA_CLASSES}
              />
            )}
          </Field>

          <ErrorMessage error={updateTemplates.error} />

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSave} loading={updateTemplates.isPending}>
              <Save className="size-4" />
              Guardar
            </Button>
            <Button variant="secondary" onClick={handleRestore}>
              <RotateCcw className="size-4" />
              Restaurar el de fábrica
            </Button>
            {updateTemplates.isSuccess && !updateTemplates.isPending && (
              <span className="text-sm text-emerald-600">Guardado.</span>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
