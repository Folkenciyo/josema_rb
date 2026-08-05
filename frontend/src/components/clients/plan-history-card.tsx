"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";
import { formatDateRange } from "@/lib/format";
import type { PlanSummary } from "@/types/common";

interface PlanHistoryCardProps {
  title: string;
  plans: PlanSummary[];
  emptyDescription: string;
  buildHref?: (planId: string) => string;
  onCreate?: () => void;
}

export function PlanHistoryCard({
  title,
  plans,
  emptyDescription,
  buildHref,
  onCreate,
}: PlanHistoryCardProps) {
  // Plans in progress lead the list: they are the ones opened day to day.
  const sortedPlans = [
    ...plans.filter((plan) => plan.status === "active"),
    ...plans.filter((plan) => plan.status !== "active"),
  ];

  const createButton = onCreate ? (
    <Button size="sm" variant="secondary" onClick={onCreate}>
      <Plus className="size-4" />
      Nuevo plan
    </Button>
  ) : undefined;

  return (
    <Card>
      <CardHeader title={title} action={createButton} />
      {plans.length === 0 ? (
        <EmptyState
          title="Sin planes todavía"
          description={emptyDescription}
          action={createButton}
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {sortedPlans.map((plan) => {
            const isActive = plan.status === "active";
            const rowClassName = cn(
              "flex items-center justify-between gap-4 px-5 py-3",
              isActive && "border-l-2 border-amber-500 bg-amber-50/60 pl-[18px]",
            );
            const content = (
              <>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">
                    {plan.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDateRange(plan.start_date, plan.end_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={plan.status} />
                  {buildHref && <ChevronRight className="size-4 text-slate-400" />}
                </div>
              </>
            );

            return (
              <li key={plan.id}>
                {buildHref ? (
                  <Link
                    href={buildHref(plan.id)}
                    className={cn(
                      rowClassName,
                      isActive ? "hover:bg-amber-100/70" : "hover:bg-slate-50",
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={rowClassName}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
