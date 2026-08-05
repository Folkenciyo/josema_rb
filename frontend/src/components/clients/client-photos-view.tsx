"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { useClient } from "@/hooks/use-clients";
import { useMeasurements } from "@/hooks/use-measurements";
import { useDeletePhoto, usePhotos, useUploadPhoto } from "@/hooks/use-photos";
import { formatDate } from "@/lib/format";
import { groupIntoSessions } from "@/lib/photos/sessions";
import { todayIso } from "./measurement-form-schema";
import { PhotoCompare } from "./photo-compare";
import { PhotoSlot } from "./photo-slot";
import { PHOTO_POSES, POSE_LABELS, type PhotoPose } from "@/types/photo";

export function ClientPhotosView({ clientId }: { clientId: string }) {
  const [takenOn, setTakenOn] = useState(todayIso());
  const [uploadingPose, setUploadingPose] = useState<PhotoPose | null>(null);

  const { data: client } = useClient(clientId);
  const { data: photos, isPending, error } = usePhotos(clientId);
  const { data: measurements } = useMeasurements(clientId);
  const uploadPhoto = useUploadPhoto(clientId);
  const deletePhoto = useDeletePhoto(clientId);

  if (isPending) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  const sessions = groupIntoSessions(photos);
  const draftSession = sessions.find((session) => session.takenOn === takenOn);

  /** The date travels with the upload: reading state here would lag one render. */
  const handlePick = (pose: PhotoPose, file: File, date: string) => {
    setUploadingPose(pose);
    uploadPhoto.mutate(
      { taken_on: date, pose, file },
      { onSettled: () => setUploadingPose(null) },
    );
  };

  const handleDelete = (photoId: string, pose: PhotoPose, date: string) => {
    if (
      window.confirm(
        `¿Borrar la foto ${POSE_LABELS[pose].toLowerCase()} del ${formatDate(date)}?`,
      )
    ) {
      deletePhoto.mutate(photoId);
    }
  };

  return (
    <>
      <Link
        href={`/clients/${clientId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        {client?.full_name ?? "Cliente"}
      </Link>

      <PageHeader
        title="Fotos de progreso"
        description="Frontal, lateral y trasera en cada fecha, para ver el cambio en el físico."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Añadir fotos" />
            <div className="px-5 py-4">
              <label className="mb-4 flex max-w-xs flex-col gap-1 text-sm">
                <span className="text-slate-500">Fecha de las fotos</span>
                <Input
                  type="date"
                  value={takenOn}
                  onChange={(event) => setTakenOn(event.target.value)}
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
                {PHOTO_POSES.map((pose) => (
                  <PhotoSlot
                    key={pose}
                    pose={pose}
                    photo={draftSession?.photos[pose] ?? null}
                    isUploading={uploadingPose === pose}
                    onPick={(file) => handlePick(pose, file, takenOn)}
                  />
                ))}
              </div>

              <ErrorMessage error={uploadPhoto.error} />
              <ErrorMessage error={deletePhoto.error} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Galería" />
            {sessions.length === 0 ? (
              <EmptyState
                title="Todavía no hay fotos"
                description="Sube la primera tanda y podrás comparar la evolución con las siguientes."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {sessions.map((session) => (
                  <div key={session.takenOn} className="px-5 py-4">
                    <p className="mb-2 text-sm font-medium text-slate-800">
                      {formatDate(session.takenOn)}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {session.count} de 3
                      </span>
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {PHOTO_POSES.map((pose) => {
                        const photo = session.photos[pose];
                        return (
                          <PhotoSlot
                            key={pose}
                            pose={pose}
                            photo={photo}
                            isUploading={false}
                            onPick={(file) =>
                              handlePick(pose, file, session.takenOn)
                            }
                            onDelete={
                              photo
                                ? () =>
                                    handleDelete(photo.id, pose, session.takenOn)
                                : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <PhotoCompare sessions={sessions} measurements={measurements ?? []} />
      </div>
    </>
  );
}
