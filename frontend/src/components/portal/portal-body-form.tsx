"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { useRecordPortalBodyMeasurement } from "@/hooks/use-portal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { BODY_ZONES } from "@/lib/measurements/body";
import { parseZoneInput } from "@/lib/portal/weigh-in";
import {
  BODY_ZONE_KEYS,
  type BodyReading,
  type BodyZoneKey,
  type BodyZones,
} from "@/types/measurement";

/** What a first-timer sees before unfolding the rest: the two usual suspects. */
const STARTER_ZONES: BodyZoneKey[] = ["waist_cm", "chest_cm"];

type Draft = Record<BodyZoneKey, string>;

function draftFromToday(today: BodyReading | null): Draft {
  return Object.fromEntries(
    BODY_ZONE_KEYS.map((key) => {
      const value = today?.[key];
      return [key, value == null ? "" : String(value).replace(".", ",")];
    }),
  ) as Draft;
}

export function PortalBodyForm({
  token,
  today,
}: {
  token: string;
  /** Today's entry if there is one, so a correction starts filled in. */
  today: BodyReading | null;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFromToday(today));
  const [showAll, setShowAll] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const record = useRecordPortalBodyMeasurement(token);

  // Whatever the client has already written today stays in sight; the rest of
  // the tape spots hide behind the toggle so the form is not a wall of boxes.
  const visible = showAll
    ? BODY_ZONE_KEYS
    : BODY_ZONE_KEYS.filter(
        (key) => draft[key] !== "" || STARTER_ZONES.includes(key),
      );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const zones: Partial<BodyZones> = {};

    for (const key of BODY_ZONE_KEYS) {
      const parsed = parseZoneInput(draft[key]);
      if (!parsed.ok) {
        setLocalError(parsed.error);
        return;
      }
      // Blanks are left out instead of sent as null: from a phone, not filling
      // a box means "not measured today", never "delete what I wrote before".
      if (parsed.value !== null) {
        zones[key] = parsed.value;
      }
    }

    if (Object.keys(zones).length === 0) {
      setLocalError("Escribe al menos una medida.");
      return;
    }

    setLocalError(null);
    record.mutate({ zones, notes: null });
  };

  return (
    <Card className="px-5 py-4">
      <form onSubmit={handleSubmit}>
        <p className="mb-3 font-semibold text-slate-800">
          {today ? "Corrige tus medidas de hoy" : "Tus medidas de hoy"}
        </p>

        <div className="flex flex-col gap-2">
          {BODY_ZONES.filter(({ key }) => visible.includes(key)).map(
            ({ key, label }) => (
              <label
                key={key}
                htmlFor={`zone-${key}`}
                className="flex items-center justify-between gap-3 text-sm text-slate-600"
              >
                {label}
                <div className="relative w-32">
                  <Input
                    id={`zone-${key}`}
                    value={draft[key]}
                    onChange={(event) => {
                      const { value } = event.target;
                      setDraft((current) => ({ ...current, [key]: value }));
                      // Typing again means the previous confirmation is stale.
                      record.reset();
                    }}
                    inputMode="decimal"
                    placeholder="—"
                    autoComplete="off"
                    className="pr-9"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-400">
                    cm
                  </span>
                </div>
              </label>
            ),
          )}
        </div>

        {!showAll && visible.length < BODY_ZONE_KEYS.length && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-brand-600 mt-3 flex items-center gap-1 text-sm font-medium"
          >
            <ChevronDown className={cn("size-4")} />
            Ver las {BODY_ZONE_KEYS.length} zonas
          </button>
        )}

        <div className="mt-4 flex justify-end">
          <Button type="submit" loading={record.isPending}>
            Guardar
          </Button>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Mide siempre a la misma hora y sin apretar la cinta. Deja en blanco lo
          que no midas.
        </p>

        {localError && <p className="mt-2 text-sm text-red-600">{localError}</p>}
        {record.isSuccess && !localError && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="size-4" />
            Guardado. Tu entrenador ya lo ve.
          </p>
        )}
        <div className="mt-2">
          <ErrorMessage error={record.error} />
        </div>
      </form>
    </Card>
  );
}
