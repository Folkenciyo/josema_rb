"use client";

import { cn } from "@/lib/cn";

interface MusclePickerProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (muscles: string[]) => void;
}

export function MusclePicker({
  label,
  options,
  selected,
  onChange,
}: MusclePickerProps) {
  const toggle = (muscle: string) =>
    onChange(
      selected.includes(muscle)
        ? selected.filter((item) => item !== muscle)
        : [...selected, muscle],
    );

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((muscle) => {
          const isSelected = selected.includes(muscle);

          return (
            <button
              key={muscle}
              type="button"
              onClick={() => toggle(muscle)}
              aria-pressed={isSelected}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isSelected
                  ? "border-amber-500 bg-amber-500 text-slate-900"
                  : "border-slate-300 bg-surface text-slate-600 hover:bg-slate-50",
              )}
            >
              {muscle}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
