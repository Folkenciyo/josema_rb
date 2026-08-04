import { cn } from "@/lib/cn";
import type { MacroTotals } from "@/types/diet";

interface MacroEntry {
  key: keyof MacroTotals;
  label: string;
  unit: string;
}

/** The four the trainer works with day to day. */
const MAIN_MACROS: MacroEntry[] = [
  { key: "calories", label: "kcal", unit: "" },
  { key: "protein_g", label: "P", unit: "g" },
  { key: "carbs_g", label: "C", unit: "g" },
  { key: "fat_g", label: "G", unit: "g" },
];

/** The rest of the label, shown only where there is room for it. */
const LABEL_EXTRAS: MacroEntry[] = [
  { key: "sugars_g", label: "azúcares", unit: "g" },
  { key: "saturated_fat_g", label: "saturadas", unit: "g" },
  { key: "fiber_g", label: "fibra", unit: "g" },
  { key: "salt_g", label: "sal", unit: "g" },
];

function format(value: number): string {
  return String(Math.round(value * 10) / 10);
}

export function MacroSummary({
  totals,
  detailed = false,
  className,
}: {
  totals: MacroTotals;
  /** Adds sugars, saturates, fibre and salt below the four macros. */
  detailed?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {MAIN_MACROS.map(({ key, label, unit }) => (
          <span key={key} className="text-slate-500">
            <span className="font-semibold text-slate-700">
              {format(totals[key])}
              {unit}
            </span>{" "}
            {label}
          </span>
        ))}
      </div>
      {detailed && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
          {LABEL_EXTRAS.map(({ key, label, unit }) => (
            <span key={key}>
              {label} {format(totals[key])}
              {unit}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
