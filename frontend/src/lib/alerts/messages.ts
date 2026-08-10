import { PLAN_KIND_LABELS, type PlanKind } from "@/types/alert";

export type AlertTone = "warning" | "danger";

const DAYS_PER_MONTH = 30;
/** Past this many days a raw day count stops being readable at a glance. */
const MONTHS_THRESHOLD_DAYS = 60;

export function describeMissingPlans(missing: PlanKind[]): string {
  const labels = missing.map((kind) => PLAN_KIND_LABELS[kind]);

  if (labels.length > 1) {
    return `Sin ${labels.join(" ni ")} activas`;
  }

  return `Sin ${labels[0]} activa`;
}

export function describeExpiry(daysLeft: number): {
  label: string;
  tone: AlertTone;
} {
  if (daysLeft < 0) {
    const daysAgo = Math.abs(daysLeft);
    return {
      label: daysAgo === 1 ? "Caducó ayer" : `Caducó hace ${daysAgo} días`,
      tone: "danger",
    };
  }

  if (daysLeft === 0) {
    return { label: "Caduca hoy", tone: "danger" };
  }

  return {
    label: daysLeft === 1 ? "Caduca mañana" : `Caduca en ${daysLeft} días`,
    tone: "warning",
  };
}

export function describeStaleWeighIn(daysSince: number | null): string {
  if (daysSince === null) {
    return "Nunca se ha pesado";
  }

  if (daysSince >= MONTHS_THRESHOLD_DAYS) {
    const months = Math.floor(daysSince / DAYS_PER_MONTH);
    return `${months} meses sin pesarse`;
  }

  return `${daysSince} días sin pesarse`;
}
