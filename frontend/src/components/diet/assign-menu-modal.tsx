"use client";

import { useState } from "react";

import { useMenus } from "@/hooks/use-diet-catalog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ErrorMessage } from "@/components/ui/feedback";
import { Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { DAY_LABELS, DAYS_OF_WEEK, type DayOfWeek } from "@/types/common";
import type { AssignMenuInput } from "@/types/diet-plan";

interface AssignMenuModalProps {
  isSubmitting: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (input: AssignMenuInput) => void;
}

export function AssignMenuModal({
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: AssignMenuModalProps) {
  const { data: menus } = useMenus();
  const [menuId, setMenuId] = useState("");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    ...DAYS_OF_WEEK,
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleDay = (day: DayOfWeek) =>
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );

  const allDaysSelected = selectedDays.length === DAYS_OF_WEEK.length;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (menuId === "") {
      setValidationError("Elige un menú.");
      return;
    }
    if (selectedDays.length === 0) {
      setValidationError("Elige al menos un día.");
      return;
    }

    setValidationError(null);
    onSubmit({
      menu_id: menuId,
      // `null` lets the backend apply it to the whole week.
      days_of_week: allDaysSelected ? null : selectedDays,
    });
  };

  return (
    <Modal title="Asignar menú a varios días" onClose={onClose}>
      <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <Field label="Menú">
          {(props) => (
            <Select
              {...props}
              value={menuId}
              onChange={(event) => setMenuId(event.target.value)}
            >
              <option value="">Elige…</option>
              {(menus ?? []).map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-slate-700">Días</legend>
          <div className="flex flex-wrap gap-1.5">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.includes(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isSelected
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "bg-surface border-slate-300 text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedDays([...DAYS_OF_WEEK])}
            >
              Todos
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedDays([])}
            >
              Ninguno
            </Button>
          </div>
        </fieldset>

        {validationError && <ErrorMessage error={new Error(validationError)} />}
        <ErrorMessage error={error} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Asignar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
