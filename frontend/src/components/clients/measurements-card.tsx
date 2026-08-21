"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorMessage } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import {
  useCreateMeasurement,
  useDeleteMeasurement,
  useMeasurements,
  useUpdateMeasurement,
} from "@/hooks/use-measurements";
import { formatDate } from "@/lib/format";
import {
  BMI_CATEGORY_LABELS,
  bmiCategory,
  formatDelta,
  formatWeight,
  summarizeProgress,
  type BmiCategory,
} from "@/lib/measurements/progress";
import type { Measurement } from "@/types/measurement";
import { MeasurementForm } from "./measurement-form";
import { WeightChart } from "./weight-chart";

const BMI_BADGE_CLASSES: Record<BmiCategory, string> = {
  underweight: "bg-sky-100 text-sky-700",
  normal: "bg-emerald-100 text-emerald-700",
  overweight: "bg-amber-100 text-amber-700",
  obese: "bg-red-100 text-red-700",
};

function Delta({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return null;
  }

  return (
    <span className="text-slate-500">
      {label}{" "}
      <span className="font-semibold text-slate-700">{formatDelta(value)}</span>
    </span>
  );
}

/** Weight, BMI and the trend at a glance; the history lives underneath. */
export function MeasurementsCard({
  clientId,
  hasHeight,
}: {
  clientId: string;
  hasHeight: boolean;
}) {
  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Measurement | null>(null);

  const { data: measurements, isPending, error } = useMeasurements(clientId);
  const createMeasurement = useCreateMeasurement(clientId);
  const updateMeasurement = useUpdateMeasurement(clientId);
  const deleteMeasurement = useDeleteMeasurement(clientId);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    createMeasurement.reset();
    updateMeasurement.reset();
  };

  const addButton = (
    <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
      <Plus className="size-4" />
      Añadir peso
    </Button>
  );

  const progress = summarizeProgress(measurements ?? []);
  const category = bmiCategory(progress.latest?.bmi ?? null);

  const handleDelete = (measurement: Measurement) => {
    if (
      window.confirm(
        `¿Borrar el pesaje del ${formatDate(measurement.measured_on)}?`,
      )
    ) {
      deleteMeasurement.mutate(measurement.id);
    }
  };

  return (
    <Card>
      <CardHeader title="Peso y seguimiento" action={addButton} />

      {isPending ? (
        <div className="flex justify-center py-8">
          <Spinner className="text-brand-600 size-5" />
        </div>
      ) : error ? (
        <div className="px-5 py-4">
          <ErrorMessage error={error} />
        </div>
      ) : !progress.latest ? (
        <EmptyState
          title="Sin pesajes todavía"
          description="Apunta el peso del cliente para seguir su evolución y calcular el IMC."
          action={addButton}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 px-5 py-4">
            <p className="text-3xl font-semibold text-slate-800">
              {formatWeight(progress.latest.weight_kg)}
            </p>
            {progress.latest.bmi !== null && category && (
              <span className="flex items-center gap-2 text-sm text-slate-500">
                IMC{" "}
                <span className="font-semibold text-slate-700">
                  {progress.latest.bmi.toFixed(1).replace(".", ",")}
                </span>
                <Badge className={BMI_BADGE_CLASSES[category]}>
                  {BMI_CATEGORY_LABELS[category]}
                </Badge>
              </span>
            )}
            <div className="flex w-full gap-4 text-sm">
              <Delta label="Desde el anterior" value={progress.sincePrevious} />
              <Delta label="Desde el inicio" value={progress.sinceStart} />
            </div>
            {!hasHeight && (
              <p className="w-full text-xs text-slate-500">
                Añade la altura del cliente para calcular su IMC.
              </p>
            )}
          </div>

          <WeightChart measurements={measurements} />

          <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
            {measurements.map((measurement, index) => {
              const previous = measurements[index + 1];
              const delta = previous
                ? measurement.weight_kg - previous.weight_kg
                : null;

              return (
                <li
                  key={measurement.id}
                  className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {formatWeight(measurement.weight_kg)}
                      <span className="ml-2 font-normal text-slate-500">
                        {formatDate(measurement.measured_on)}
                      </span>
                      {delta !== null && (
                        <span className="ml-2 text-xs text-slate-500">
                          {formatDelta(Math.round(delta * 10) / 10)}
                        </span>
                      )}
                    </p>
                    {measurement.client_notes && (
                      <p className="text-xs whitespace-pre-line text-slate-600">
                        {measurement.client_notes}
                      </p>
                    )}
                    {measurement.notes && (
                      <p className="truncate text-xs text-slate-500 italic">
                        {measurement.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      title="Editar pesaje"
                      onClick={() => setEditing(measurement)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Editar pesaje</span>
                    </button>
                    <button
                      type="button"
                      title="Borrar pesaje"
                      onClick={() => handleDelete(measurement)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Borrar pesaje</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {deleteMeasurement.error && (
        <div className="px-5 pb-4">
          <ErrorMessage error={deleteMeasurement.error} />
        </div>
      )}

      {isFormOpen && (
        <Modal title="Añadir pesaje" onClose={closeForm}>
          <MeasurementForm
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
        <Modal title="Editar pesaje" onClose={closeForm}>
          <MeasurementForm
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
