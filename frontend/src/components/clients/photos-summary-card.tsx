"use client";

import Link from "next/link";
import { Camera, ChevronRight } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { photoUrl } from "@/lib/api/photos";
import { formatDate } from "@/lib/format";
import { groupIntoSessions } from "@/lib/photos/sessions";
import { usePhotos } from "@/hooks/use-photos";
import { PHOTO_POSES, POSE_LABELS } from "@/types/photo";

/** Latest session at a glance; the gallery and the comparison live on their own page. */
export function PhotosSummaryCard({ clientId }: { clientId: string }) {
  const { data: photos } = usePhotos(clientId);
  const sessions = groupIntoSessions(photos ?? []);
  const latest = sessions[0];

  const openLink = (
    <Link
      href={`/clients/${clientId}/photos`}
      className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:underline"
    >
      {sessions.length > 1 ? "Ver y comparar" : "Ver galería"}
      <ChevronRight className="size-4" />
    </Link>
  );

  return (
    <Card>
      <CardHeader title="Fotos de progreso" action={openLink} />
      {!latest ? (
        <EmptyState
          title="Sin fotos todavía"
          description="Sube frontal, lateral y trasera para seguir el cambio en el físico."
          action={
            <Link
              href={`/clients/${clientId}/photos`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
            >
              <Camera className="size-4" />
              Añadir fotos
            </Link>
          }
        />
      ) : (
        <div className="px-5 py-4">
          <p className="mb-2 text-sm text-slate-500">
            Última tanda: {formatDate(latest.takenOn)}
            <span className="ml-2 text-xs">
              · {sessions.length}{" "}
              {sessions.length === 1 ? "fecha" : "fechas"} en total
            </span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {PHOTO_POSES.map((pose) => {
              const photo = latest.photos[pose];
              return (
                <div
                  key={pose}
                  className="aspect-[3/4] overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- served by our own authenticated endpoint
                    <img
                      src={photoUrl(photo.id, { thumbnail: true })}
                      alt={`${POSE_LABELS[pose]} del ${photo.taken_on}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs text-slate-400">
                      {POSE_LABELS[pose]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
