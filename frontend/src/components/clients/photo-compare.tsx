"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { photoUrl } from "@/lib/api/photos";
import { formatDate } from "@/lib/format";
import { formatDelta, formatWeight } from "@/lib/measurements/progress";
import {
  buildComparison,
  weightDeltaBetween,
  weightNearestTo,
  type DatedPhoto,
  type PhotoSession,
} from "@/lib/photos/sessions";
import { POSE_LABELS } from "@/types/photo";
import type { WeighIn } from "@/types/measurement";

/** Where the image comes from: the trainer's endpoint, or the client's token. */
type PhotoSrc = (photoId: string) => string;

function Side({
  photo,
  date,
  measurements,
  photoSrc,
}: {
  photo: DatedPhoto | null;
  date: string;
  measurements: WeighIn[];
  photoSrc: PhotoSrc;
}) {
  const weight = weightNearestTo(measurements, date);

  return (
    <figure className="flex flex-col gap-1">
      <div className="aspect-[3/4] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by our own authenticated endpoint
          <img
            src={photoSrc(photo.id)}
            alt={`${POSE_LABELS[photo.pose]} del ${photo.taken_on}`}
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center px-2 text-center text-xs text-slate-400">
            Sin foto en esta fecha
          </span>
        )}
      </div>
      <figcaption className="text-xs text-slate-500">
        {formatDate(date)}
        {weight && (
          <span className="ml-1 font-medium text-slate-700">
            · {formatWeight(weight.weight_kg)}
            {weight.measured_on !== date && " (pesaje más cercano)"}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

/** Two dates face to face, pose by pose, with the weight of each moment. */
export function PhotoCompare<T extends DatedPhoto>({
  sessions,
  measurements,
  photoSrc = photoUrl,
}: {
  sessions: PhotoSession<T>[];
  measurements: WeighIn[];
  photoSrc?: PhotoSrc;
}) {
  const dates = sessions.map((session) => session.takenOn);
  const [beforeDate, setBeforeDate] = useState(dates[dates.length - 1] ?? "");
  const [afterDate, setAfterDate] = useState(dates[0] ?? "");

  if (sessions.length < 2) {
    return null;
  }

  const before = sessions.find((s) => s.takenOn === beforeDate) ?? null;
  const after = sessions.find((s) => s.takenOn === afterDate) ?? null;
  const rows = buildComparison(before, after);
  const delta = weightDeltaBetween(measurements, beforeDate, afterDate);

  return (
    <Card>
      <CardHeader title="Comparar dos fechas" />

      <div className="flex flex-wrap items-end gap-3 px-5 py-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">Antes</span>
          <Select
            value={beforeDate}
            onChange={(event) => setBeforeDate(event.target.value)}
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {formatDate(date)}
              </option>
            ))}
          </Select>
        </label>
        <ArrowRight className="mb-2.5 size-4 text-slate-400" />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-500">Después</span>
          <Select
            value={afterDate}
            onChange={(event) => setAfterDate(event.target.value)}
          >
            {dates.map((date) => (
              <option key={date} value={date}>
                {formatDate(date)}
              </option>
            ))}
          </Select>
        </label>
        {delta !== null && (
          <p className="mb-2 text-sm text-slate-500">
            Diferencia de peso{" "}
            <span className="font-semibold text-slate-800">
              {formatDelta(delta)}
            </span>
          </p>
        )}
      </div>

      <div className="space-y-5 border-t border-slate-100 px-5 py-4">
        {rows.map((row) => (
          <div key={row.pose}>
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {POSE_LABELS[row.pose]}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Side
                photo={row.before}
                date={beforeDate}
                measurements={measurements}
                photoSrc={photoSrc}
              />
              <Side
                photo={row.after}
                date={afterDate}
                measurements={measurements}
                photoSrc={photoSrc}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
