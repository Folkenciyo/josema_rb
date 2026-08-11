"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useScaleMenu } from "@/hooks/use-diet-catalog";
import type { Menu } from "@/types/diet";

const STEPS = [-400, -200, 200, 400];

/**
 * The same menu at another calorie target. It always creates a new menu: this
 * one may already be handed out inside somebody else's week.
 */
export function ScaleMenuModal({
  menu,
  onClose,
}: {
  menu: Menu;
  onClose: () => void;
}) {
  const current = Math.round(menu.totals.calories);
  const [target, setTarget] = useState(String(current + 200));
  const scaleMenu = useScaleMenu();

  const parsed = Number(target.replace(",", "."));
  const isValid = Number.isFinite(parsed) && parsed > 500 && parsed <= 6000;

  return (
    <Modal title={`Escalar "${menu.name}"`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          Ahora son <strong>{current} kcal</strong>. Se creará un menú nuevo con
          las cantidades recalculadas; este se queda como está.
        </p>

        <div className="flex flex-wrap gap-2">
          {STEPS.map((step) => (
            <Button
              key={step}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setTarget(String(current + step))}
            >
              {step > 0 ? `+${step}` : step}
            </Button>
          ))}
        </div>

        <Field label="Calorías del menú nuevo">
          {(props) => (
            <Input
              {...props}
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              inputMode="numeric"
              autoFocus
            />
          )}
        </Field>

        <ErrorMessage error={scaleMenu.error} />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!isValid}
            loading={scaleMenu.isPending}
            onClick={() =>
              scaleMenu.mutate(
                { menuId: menu.id, targetCalories: parsed },
                { onSuccess: onClose },
              )
            }
          >
            Crear menú escalado
          </Button>
        </div>
      </div>
    </Modal>
  );
}
