import { cn } from "@/lib/cn";
import type { MacroTotals } from "@/types/diet";

const MACRO_LABELS: { key: keyof MacroTotals; label: string; unit: string }[] = [
  { key: "calories", label: "kcal", unit: "" },
  { key: "protein_g", label: "P", unit: "g" },
  { key: "carbs_g", label: "C", unit: "g" },
  { key: "fat_g", label: "G", unit: "g" },
];

export function MacroSummary({
  totals,
  className,
}: {
  totals: MacroTotals;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-x-3 gap-y-1 text-xs", className)}>
      {MACRO_LABELS.map(({ key, label, unit }) => (
        <span key={key} className="text-slate-500">
          <span className="font-semibold text-slate-700">
            {Math.round(totals[key] * 10) / 10}
            {unit}
          </span>{" "}
          {label}
        </span>
      ))}
    </div>
  );
}
