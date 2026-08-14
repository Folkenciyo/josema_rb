"use client";

import { BrandWordmark } from "@/components/ui/brand-logo";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/feedback";

export function PortalHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-4">
      <BrandWordmark className="mb-2 h-5 w-auto" />
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </header>
  );
}

export function PortalPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
      {children}
    </main>
  );
}

/**
 * A failed portal call means one of two things: the link died, or the trainer
 * has not published that part yet. Both read the same to the client — nothing
 * to do but wait or ask — so they share a card.
 */
export function PortalNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="px-5 py-6 text-center">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </Card>
  );
}

export function PortalLoading() {
  return <LoadingState />;
}
