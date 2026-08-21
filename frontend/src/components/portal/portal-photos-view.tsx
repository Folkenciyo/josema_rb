"use client";

import { PhotoCompare } from "@/components/clients/photo-compare";
import { Card } from "@/components/ui/card";
import {
  usePortalHome,
  usePortalMeasurements,
  usePortalPhotos,
} from "@/hooks/use-portal";
import { portalPhotoUrl } from "@/lib/api/portal";
import { formatDate } from "@/lib/format";
import { groupIntoSessions } from "@/lib/photos/sessions";
import { PHOTO_POSES, POSE_LABELS } from "@/types/photo";
import type { PortalPhoto } from "@/types/portal";
import { PortalPhotoConsent } from "./portal-photo-consent";
import {
  PortalHeader,
  PortalLoading,
  PortalNotice,
  PortalPage,
} from "./portal-shell";

/**
 * A photo the client can look at closely: the thumbnail is what loads, and the
 * full shot only travels if they actually tap it.
 */
function Shot({ photo, token }: { photo: PortalPhoto | null; token: string }) {
  const label = photo ? POSE_LABELS[photo.pose] : null;

  if (!photo) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-lg border border-dashed border-slate-200 px-1 text-center text-[11px] text-slate-400">
        Sin foto
      </div>
    );
  }

  return (
    <a
      href={portalPhotoUrl(token, photo.id)}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <figure>
        <div className="aspect-[3/4] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- served by our own endpoint, behind the token */}
          <img
            src={portalPhotoUrl(token, photo.id, { thumbnail: true })}
            alt={`${label} del ${formatDate(photo.taken_on)}`}
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
        <figcaption className="mt-1 text-center text-[11px] text-slate-500">
          {label}
        </figcaption>
      </figure>
    </a>
  );
}

export function PortalPhotosView({ token }: { token: string }) {
  const { data: home, isPending: isHomePending, error } = usePortalHome(token);
  const hasConsented = home?.photo_consent_at != null;

  const { data: photos, isPending: arePhotosPending } = usePortalPhotos(
    token,
    hasConsented,
  );
  const { data: measurements } = usePortalMeasurements(token);

  if (isHomePending) {
    return (
      <PortalPage>
        <PortalLoading />
      </PortalPage>
    );
  }

  if (error || !home) {
    return (
      <PortalPage>
        <PortalHeader title="Mis fotos" />
        <PortalNotice
          title="Este enlace ya no sirve"
          description="Pídele a tu entrenador el enlace nuevo y vuelve a entrar."
        />
      </PortalPage>
    );
  }

  // The permission is what opens the gallery, so this screen is also where it
  // can be given: arriving here without it is not a dead end.
  if (!hasConsented) {
    return (
      <PortalPage>
        <PortalHeader
          title="Mis fotos"
          subtitle="Solo tú y tu entrenador las veis."
        />
        <PortalPhotoConsent token={token} />
      </PortalPage>
    );
  }

  if (arePhotosPending) {
    return (
      <PortalPage>
        <PortalHeader title="Mis fotos" />
        <PortalLoading />
      </PortalPage>
    );
  }

  const sessions = groupIntoSessions(photos ?? []);

  return (
    <PortalPage>
      <PortalHeader
        title="Mis fotos"
        subtitle="Toca cualquiera para verla en grande."
      />

      {sessions.length === 0 ? (
        <PortalNotice
          title="Todavía no hay fotos"
          description="Las hace tu entrenador en las revisiones. En cuanto haya dos fechas podrás compararlas."
        />
      ) : (
        <>
          <Card>
            <h2 className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">
              Por fecha
            </h2>
            <div className="divide-y divide-slate-100">
              {sessions.map((session) => (
                <div key={session.takenOn} className="px-4 py-3">
                  <p className="mb-2 text-sm font-medium text-slate-800">
                    {formatDate(session.takenOn)}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {PHOTO_POSES.map((pose) => (
                      <Shot
                        key={pose}
                        photo={session.photos[pose]}
                        token={token}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <PhotoCompare
            sessions={sessions}
            measurements={measurements ?? []}
            photoSrc={(photoId) => portalPhotoUrl(token, photoId)}
          />
        </>
      )}

      <PortalPhotoConsent token={token} />
    </PortalPage>
  );
}
