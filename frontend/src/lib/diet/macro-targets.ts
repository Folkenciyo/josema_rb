import type { MacroTotals } from "@/types/diet";
import type { DietPlan } from "@/types/diet-plan";

export type TargetStatus = "on-target" | "under" | "over";

export interface TargetComparison {
  key: "calories" | "protein_g" | "carbs_g" | "fat_g";
  label: string;
  unit: string;
  actual: number;
  target: number;
  /** Signed gap: negative means short of the target. */
  difference: number;
  status: TargetStatus;
  /** Clamped to 100 so the bar never overflows its track. */
  percentage: number;
}

export interface DailyTargets {
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}

/** Anything within this band of the target counts as hitting it. */
const TOLERANCE = 0.1;

const TARGET_LABELS: { key: TargetComparison["key"]; label: string; unit: string }[] =
  [
    { key: "calories", label: "Calorías", unit: "kcal" },
    { key: "protein_g", label: "Proteína", unit: "g" },
    { key: "carbs_g", label: "Hidratos", unit: "g" },
    { key: "fat_g", label: "Grasa", unit: "g" },
  ];

export function planTargets(plan: DietPlan): DailyTargets {
  return {
    calories: plan.daily_calories_target,
    protein_g: plan.daily_protein_g,
    carbs_g: plan.daily_carbs_g,
    fat_g: plan.daily_fat_g,
  };
}

export function hasAnyTarget(targets: DailyTargets): boolean {
  return Object.values(targets).some((value) => value !== null && value > 0);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Compares a day's totals against the plan's daily targets. Only targets the
 * trainer actually filled in are returned, and falling short counts just as
 * much as going over.
 */
export function compareToTargets(
  totals: MacroTotals,
  targets: DailyTargets,
): TargetComparison[] {
  return TARGET_LABELS.flatMap(({ key, label, unit }) => {
    const target = targets[key];
    if (target === null || !(target > 0)) {
      return [];
    }

    const actual = totals[key];
    const difference = actual - target;
    const ratio = actual / target;

    const status: TargetStatus =
      Math.abs(ratio - 1) <= TOLERANCE ? "on-target" : ratio < 1 ? "under" : "over";

    return [
      {
        key,
        label,
        unit,
        actual: round(actual),
        target: round(target),
        difference: round(difference),
        status,
        percentage: Math.min(100, Math.round(ratio * 100)),
      },
    ];
  });
}
