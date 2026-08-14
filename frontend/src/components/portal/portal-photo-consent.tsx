"use client";

import { Camera, Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/feedback";
import {
  useDeleteOwnPhotos,
  useGrantPhotoConsent,
  usePortalHome,
  useWithdrawPhotoConsent,
} from "@/hooks/use-portal";
import { formatDate } from "@/lib/format";

/**
 * The client decides whether their progress photos may be kept, and can have
 * them deleted. The trainer is the one who takes them, so this is the only
 * place where the client gets a say.
 */
export function PortalPhotoConsent({ token }: { token: string }) {
  const { data: home } = usePortalHome(token);
  const grant = useGrantPhotoConsent(token);
  const withdraw = useWithdrawPhotoConsent(token);
  const deletePhotos = useDeleteOwnPhotos(token);

  if (!home) {
    return null;
  }

  const hasConsented = home.photo_consent_at !== null;

  const confirmDelete = () => {
    if (
      window.confirm(
        `Se borrarán tus ${home.photo_count} fotos y no se podrán recuperar. ¿Seguro?`,
      )
    ) {
      deletePhotos.mutate();
    }
  };

  return (
    <Card className="px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="bg-brand-100 text-brand-600 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Camera className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-800">
            Tus fotos de progreso
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {hasConsented
              ? `Autorizaste guardarlas el ${formatDate(home.photo_consent_at!)}. Puedes retirar el permiso o pedir que se borren cuando quieras.`
              : "Tu entrenador puede hacerte fotos para comparar tu evolución. Solo se guardan si tú lo autorizas."}
          </p>
        </div>
      </div>

      <ErrorMessage
        error={grant.error ?? withdraw.error ?? deletePhotos.error}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {hasConsented ? (
          <Button
            variant="secondary"
            onClick={() => withdraw.mutate()}
            loading={withdraw.isPending}
          >
            Retirar el permiso
          </Button>
        ) : (
          <Button onClick={() => grant.mutate()} loading={grant.isPending}>
            <Check className="size-4" />
            Autorizo a guardarlas
          </Button>
        )}

        {home.photo_count > 0 && (
          <Button
            variant="danger"
            onClick={confirmDelete}
            loading={deletePhotos.isPending}
          >
            <Trash2 className="size-4" />
            Borrar mis {home.photo_count} fotos
          </Button>
        )}
      </div>
    </Card>
  );
}
