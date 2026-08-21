"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { useRecordPortalWeighIn } from "@/hooks/use-portal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/feedback";
import { Input, Textarea } from "@/components/ui/input";
import { parseWeightInput } from "@/lib/portal/weigh-in";

export function PortalWeighInForm({
  token,
  weighedToday,
  notesToday,
}: {
  token: string;
  /** Today's weight if it is already on record, so a correction starts filled in. */
  weighedToday: number | null;
  notesToday: string | null;
}) {
  const [value, setValue] = useState(
    weighedToday !== null ? String(weighedToday).replace(".", ",") : "",
  );
  const [notes, setNotes] = useState(notesToday ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const recordWeighIn = useRecordPortalWeighIn(token);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseWeightInput(value);

    if (!parsed.ok) {
      setLocalError(parsed.error);
      return;
    }

    setLocalError(null);
    recordWeighIn.mutate({ weightKg: parsed.weightKg, notes: notes.trim() || null });
  };

  return (
    <Card className="px-5 py-4">
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="portal-weight"
          className="mb-2 block font-semibold text-slate-800"
        >
          {weighedToday !== null ? "Corrige tu peso de hoy" : "¿Cuánto pesas hoy?"}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="portal-weight"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                // Typing again means the previous confirmation is stale.
                recordWeighIn.reset();
              }}
              inputMode="decimal"
              placeholder="80,5"
              autoComplete="off"
              className="pr-10"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-400">
              kg
            </span>
          </div>
          <Button type="submit" loading={recordWeighIn.isPending}>
            Guardar
          </Button>
        </div>

        <label
          htmlFor="portal-weight-notes"
          className="mt-3 block text-sm text-slate-500"
        >
          Observaciones (opcional)
          <Textarea
            id="portal-weight-notes"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              recordWeighIn.reset();
            }}
            rows={2}
            maxLength={500}
            className="mt-1"
            placeholder="Grasa 18%, agua 55%, músculo 38 kg…"
          />
        </label>
        <p className="mt-1 text-xs text-slate-400">
          Si tu báscula te da más datos, apúntalos aquí como quieras: tu
          entrenador los verá junto al peso.
        </p>

        {localError && <p className="mt-2 text-sm text-red-600">{localError}</p>}
        {recordWeighIn.isSuccess && !localError && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="size-4" />
            Guardado. Tu entrenador ya lo ve.
          </p>
        )}
        <div className="mt-2">
          <ErrorMessage error={recordWeighIn.error} />
        </div>
      </form>
    </Card>
  );
}
