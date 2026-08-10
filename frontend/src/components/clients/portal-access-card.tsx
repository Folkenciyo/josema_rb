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
 * WhatsApp on the desktop app does not always honour a prefilled draft, so the
 * message also goes to the clipboard: worst case the trainer pastes it.
 */
function SendButtons({
  invite,
  phone,
  email,
}: {
  invite: PortalInvite;
  phone: string | null;
  email: string | null;
}) {
  const whatsAppHref = toWhatsAppHref(phone, invite.whatsapp_text);
  const mailtoHref = toMailtoHref(email, {
    subject: invite.subject,
    body: invite.body,
  });

  const openWhatsApp = async () => {
    await navigator.clipboard.writeText(invite.whatsapp_text);
    window.open(whatsAppHref ?? "", "_blank", "noopener");
  };

  return (
    <div className="flex flex-wrap gap-2">
      {whatsAppHref ? (
        <Button variant="secondary" size="sm" onClick={openWhatsApp}>
          <MessageCircle className="size-4" />
          Enviar por WhatsApp
        </Button>
      ) : (
        <p className="text-xs text-slate-400">
          Añade un teléfono a la ficha para enviarlo por WhatsApp.
        </p>
      )}

      {mailtoHref ? (
        <a
          href={mailtoHref}
          className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <Mail className="size-4" />
          Enviar por email
        </a>
      ) : (
        <p className="text-xs text-slate-400">
          Añade un email a la ficha para enviarlo por correo.
        </p>
      )}
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
              Genera un enlace privado para que vea su rutina, su dieta y su peso
              desde el móvil. No caduca, y puedes anularlo cuando quieras.
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
              <SendButtons invite={invite} phone={phone} email={email} />
            )}
          </>
        )}

        <ErrorMessage error={issueToken.error ?? revokeToken.error} />
      </div>
    </Card>
  );
}
