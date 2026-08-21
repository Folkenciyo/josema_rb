"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorMessage } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import {
  useBodyMeasurements,
  useCreateBodyMeasurement,
  useDeleteBodyMeasurement,
  useUpdateBodyMeasurement,
} from "@/hooks/use-measurements";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import {
  BODY_ZONE_LABELS,
  formatCentimetreDelta,
  formatCentimetres,
  measuredZones,
  summarizeZone,
  zoneSeries,
} from "@/lib/measurements/body";
import type { BodyMeasurement, BodyZoneKey } from "@/types/measurement";
import { BodyMeasurementForm } from "./body-measurement-form";
import { TrendChart } from "./trend-chart";

function Delta({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return null;
  }

  return (
    <span className="text-slate-500">
      {label}{" "}
      <span className="font-semibold text-slate-700">
        {formatCentimetreDelta(value)}
      </span>
    </span>
  );
}

/** Tape readings by zone: a chart for the zone in focus, the full table below. */
export function BodyMeasurementsCard({ clientId }: { clientId: string }) {
  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BodyMeasurement | null>(null);
  const [pickedZone, setPickedZone] = useState<BodyZoneKey | null>(null);

  const { data: measurements, isPending, error } = useBodyMeasurements(clientId);
  const createMeasurement = useCreateBodyMeasurement(clientId);
  const updateMeasurement = useUpdateBodyMeasurement(clientId);
  const deleteMeasurement = useDeleteBodyMeasurement(clientId);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    createMeasurement.reset();
    updateMeasurement.reset();
  };

  const addButton = (
    <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
      <Plus className="size-4" />
      Añadir medidas
    </Button>
  );

  const readings = measurements ?? [];
  const zones = measuredZones(readings);
  // The picked zone survives until it stops having readings, so deleting the
  // last entry of a zone falls back instead of charting nothing.
  const zone = pickedZone && zones.includes(pickedZone) ? pickedZone : zones[0];
  const progress = zone ? summarizeZone(readings, zone) : null;

  const handleDelete = (measurement: BodyMeasurement) => {
    if (
      window.confirm(
        `¿Borrar las medidas del ${formatDate(measurement.measured_on)}?`,
      )
    ) {
      deleteMeasurement.mutate(measurement.id);
    }
  };

  return (
    <Card>
      <CardHeader title="Medidas corporales" action={addButton} />

      {isPending ? (
        <div className="flex justify-center py-8">
          <Spinner className="text-brand-600 size-5" />
        </div>
      ) : error ? (
        <div className="px-5 py-4">
          <ErrorMessage error={error} />
        </div>
      ) : !zone || !progress?.latest ? (
        <EmptyState
          title="Sin medidas todavía"
          description="Apunta el contorno de las zonas que midas con la cinta. El cliente también puede apuntarlas desde su enlace."
          action={addButton}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 px-5 pt-4">
            {zones.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPickedZone(key)}
                aria-pressed={key === zone}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  key === zone
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {BODY_ZONE_LABELS[key]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 px-5 pt-3">
            <p className="text-3xl font-semibold text-slate-800">
              {formatCentimetres(progress.latest.value)}
            </p>
            <span className="text-sm text-slate-500">
              {BODY_ZONE_LABELS[zone]} ·{" "}
              {formatDate(progress.latest.measured_on)}
            </span>
            <div className="flex w-full gap-4 text-sm">
              <Delta label="Desde la anterior" value={progress.sincePrevious} />
              <Delta label="Desde el inicio" value={progress.sinceStart} />
            </div>
          </div>

          <TrendChart
            entries={zoneSeries(readings, zone)}
            label={`Evolución de ${BODY_ZONE_LABELS[zone].toLowerCase()}`}
            format={formatCentimetres}
          />

          <div className="max-h-72 overflow-auto border-t border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-surface sticky top-0 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-2 text-left font-medium">Fecha</th>
                  {zones.map((key) => (
                    <th
                      key={key}
                      className="px-2 py-2 text-right font-medium whitespace-nowrap"
                    >
                      {BODY_ZONE_LABELS[key]}
                    </th>
                  ))}
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((measurement) => (
                  <tr key={measurement.id}>
                    <td className="px-5 py-2 whitespace-nowrap text-slate-500">
                      {formatDate(measurement.measured_on)}
                      {(measurement.client_notes || measurement.notes) && (
                        <span className="block max-w-40 truncate text-xs text-slate-400">
                          {measurement.client_notes ?? measurement.notes}
                        </span>
                      )}
                    </td>
                    {zones.map((key) => (
                      <td
                        key={key}
                        className="px-2 py-2 text-right whitespace-nowrap text-slate-800"
                      >
                        {measurement[key] === null
                          ? "—"
                          : formatCentimetres(measurement[key])}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Editar medidas"
                          onClick={() => setEditing(measurement)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Editar medidas</span>
                        </button>
                        <button
                          type="button"
                          title="Borrar medidas"
                          onClick={() => handleDelete(measurement)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Borrar medidas</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {deleteMeasurement.error && (
        <div className="px-5 pb-4">
          <ErrorMessage error={deleteMeasurement.error} />
        </div>
      )}

      {isFormOpen && (
        <Modal title="Añadir medidas" onClose={closeForm}>
          <BodyMeasurementForm
            submitLabel="Guardar"
            isSubmitting={createMeasurement.isPending}
            error={createMeasurement.error}
            onCancel={closeForm}
            onSubmit={(input) =>
              createMeasurement.mutate(input, { onSuccess: closeForm })
            }
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar medidas" onClose={closeForm}>
          <BodyMeasurementForm
            measurement={editing}
            submitLabel="Guardar cambios"
            isSubmitting={updateMeasurement.isPending}
            error={updateMeasurement.error}
            onCancel={closeForm}
            onSubmit={(input) =>
              updateMeasurement.mutate(
                { measurementId: editing.id, input },
                { onSuccess: closeForm },
              )
            }
          />
        </Modal>
      )}
    </Card>
  );
}
