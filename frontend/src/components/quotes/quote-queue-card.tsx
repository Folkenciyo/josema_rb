"use client";

import { CalendarClock } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useQuoteQueue } from "@/hooks/use-quotes";
import { dayLabel } from "@/lib/quotes/schedule";
import { QuoteMedia } from "./quote-media";

const UPCOMING_DAYS = 6;

/** What every client is reading today, and what they will read next. */
export function QuoteQueueCard() {
  const { data: queue, isPending } = useQuoteQueue(UPCOMING_DAYS);

  if (isPending) {
    return (
      <Card className="mb-4 px-5 py-4">
        <Spinner className="size-4" />
      </Card>
    );
  }

  if (!queue?.today) {
    return null;
  }

  const { today, upcoming } = queue;

  return (
    <Card className="mb-4">
      <CardHeader title="Hoy leen esto" />

      <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
        <div>
          {today.quote.media_kind !== "none" && (
            <div className="mb-3">
              <QuoteMedia quote={today.quote} />
            </div>
          )}
          <p className="text-lg text-slate-800">«{today.quote.text}»</p>
          {today.quote.author && (
            <p className="mt-1 text-sm text-slate-500">— {today.quote.author}</p>
          )}
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <CalendarClock className="size-3.5" />
            Después
          </p>
          <ol className="divide-y divide-slate-100">
            {upcoming.map((entry) => (
              <li key={entry.date} className="flex gap-3 py-1.5 text-sm">
                <span className="w-20 shrink-0 text-slate-400 capitalize">
                  {dayLabel(entry.date)}
                </span>
                <span className="min-w-0 flex-1 truncate text-slate-600">
                  {entry.quote.text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
}
