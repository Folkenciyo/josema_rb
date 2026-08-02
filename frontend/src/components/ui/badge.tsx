import { cn } from "@/lib/cn";
import { PLAN_STATUS_LABELS, type PlanStatus } from "@/types/common";

const STATUS_CLASSES: Record<PlanStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  active: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-200 text-slate-500",
};

export function StatusBadge({ status }: { status: PlanStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_CLASSES[status],
      )}
    >
      {PLAN_STATUS_LABELS[status]}
    </span>
  );
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600",
        className,
      )}
    >
      {children}
    </span>
  );
}
