"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Link2,
  Mail,
  MessageCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  useIssuePortalToken,
  usePortalInvite,
  useRevokePortalToken,
} from "@/hooks/use-portal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/feedback";
import { toMailtoHref, toWhatsAppHref } from "@/lib/contact";
import { formatDate } from "@/lib/format";
import { portalPath, type PortalInvite } from "@/types/portal";

const COPIED_FEEDBACK_MS = 2000;

/**
 * The message arrives already written from the trainer's own template, and stays
 * editable here for the one-off tweak that never belongs in the template.
 *
 * WhatsApp on the desktop app does not always honour a prefilled draft, so the
 * text also goes to the clipboard: worst case the trainer pastes it.
 */
function SendPanel({
  invite,
  phone,
  email,
}: {
  invite: PortalInvite;
  phone: string | null;
  email: string | null;
}) {
  const [message, setMessage] = useState(invite.whatsapp_text);
  const [hasCopied, setCopied] = useState(false);

  const whatsAppHref = toWhatsAppHref(phone, message);
  const mailtoHref = toMailtoHref(email, {
    subject: invite.subject,
    // The tweak made here travels to the email too; its body keeps its own
    // wording only while the trainer has not touched anything.
    body: message === invite.whatsapp_text ? invite.body : message,
  });

  const openWhatsApp = async () => {
    await navigator.clipboard.writeText(message);
    window.open(whatsAppHref ?? "", "_blank", "noopener");
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 pt-3">
      <label
        htmlFor="portal-invite-message"
        className="text-sm font-medium text-slate-700"
      >
        Mensaje que vas a enviar
      </label>
      <textarea
        id="portal-invite-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={5}
        className="bg-surface focus:border-brand-500 focus:ring-brand-100 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2"
      />
      <p className="text-xs text-slate-400">
        Se edita solo para este envío. Para cambiarlo siempre, ve a Ajustes.
      </p>

      <div className="flex flex-wrap gap-2">
        {whatsAppHref ? (
          <Button variant="secondary" size="sm" onClick={openWhatsApp}>
            <MessageCircle className="size-4" />
            WhatsApp
          </Button>
        ) : (
          <p className="text-xs text-slate-400">
            Añade un teléfono a la ficha para enviarlo por WhatsApp.
          </p>
        )}

        {mailtoHref ? (
          <a
            href={mailtoHref}
            className="bg-surface inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Mail className="size-4" />
            Email
          </a>
        ) : (
          <p className="text-xs text-slate-400">
            Añade un email a la ficha para enviarlo por correo.
          </p>
        )}

        <Button variant="ghost" size="sm" onClick={copyMessage}>
          {hasCopied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          {hasCopied ? "Copiado" : "Copiar mensaje"}
        </Button>
      </div>
    </div>
  );
}

export function PortalAccessCard({
  clientId,
  token,
  issuedAt,
  phone,
  email,
}: {
  clientId: string;
  token: string | null;
  issuedAt: string | null;
  phone: string | null;
  email: string | null;
}) {
  // The card only ever renders once the client data has arrived in the browser,
  // so `window` is there — but the guard keeps a server render from crashing.
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin,
  );
  const [hasCopied, setCopied] = useState(false);
  const issueToken = useIssuePortalToken(clientId);
  const revokeToken = useRevokePortalToken(clientId);
  const { data: invite } = usePortalInvite(clientId, token !== null);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [hasCopied]);

  const url = token ? `${origin}${portalPath(token)}` : null;

  const handleCopy = async () => {
    if (!url) {
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  const handleRegenerate = () => {
    if (
      window.confirm(
        "Se creará un enlace nuevo y el anterior dejará de funcionar al instante. ¿Seguimos?",
      )
    ) {
      issueToken.mutate();
    }
  };

  const handleRevoke = () => {
    if (
      window.confirm(
        "El cliente perderá el acceso a su portal hasta que le generes otro enlace. ¿Seguimos?",
      )
    ) {
      revokeToken.mutate();
    }
  };

  return (
    <Card>
      <CardHeader title="Acceso del cliente" />
      <div className="flex flex-col gap-3 px-5 py-4">
        {!token ? (
          <>
            <p className="text-sm text-slate-500">
              Genera un enlace privado para que vea su rutina, su dieta y su
              peso desde el móvil. No caduca, y puedes anularlo cuando quieras.
            </p>
            <Button
              onClick={() => issueToken.mutate()}
              loading={issueToken.isPending}
              className="self-start"
            >
              <Link2 className="size-4" />
              Generar enlace
            </Button>
          </>
        ) : (
          <>
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs break-all text-slate-600">
              {url}
            </p>
            {issuedAt && (
              <p className="text-xs text-slate-400">
                Creado el {formatDate(issuedAt)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleCopy}>
                {hasCopied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {hasCopied ? "Copiado" : "Copiar enlace"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRegenerate}
                loading={issueToken.isPending}
              >
                <RefreshCw className="size-4" />
                Regenerar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRevoke}
                loading={revokeToken.isPending}
              >
                <Trash2 className="size-4" />
                Anular
              </Button>
            </div>

            {invite && (
              // Keyed on the text: a regenerated link or an edited template
              // starts a fresh draft instead of keeping a stale one.
              <SendPanel
                key={invite.whatsapp_text}
                invite={invite}
                phone={phone}
                email={email}
              />
            )}
          </>
        )}

        <ErrorMessage error={issueToken.error ?? revokeToken.error} />
      </div>
    </Card>
  );
}
