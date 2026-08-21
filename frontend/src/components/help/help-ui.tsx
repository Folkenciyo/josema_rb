import Link from "next/link";
import { ArrowRight, ChevronRight, Info, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * The pieces every guide is written with. Instead of screenshots — which go
 * stale the day a button moves and only look right in one theme — the guides
 * draw the real controls inline, with the same icons the app uses.
 */

/** A button as it looks on screen, so the reader recognises it at a glance. */
export function Btn({
  icon: Icon,
  children,
  variant = "primary",
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <span
      className={cn(
        "mx-0.5 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-medium whitespace-nowrap",
        variant === "primary" && "bg-brand-600 text-white",
        variant === "secondary" &&
          "border border-slate-300 text-slate-700 dark:text-slate-200",
        variant === "danger" && "bg-red-600 text-white",
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  );
}

/** The name of a field or a column, quoted the way the screen writes it. */
export function Term({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-slate-100 px-1 py-0.5 font-medium text-slate-700">
      {children}
    </span>
  );
}

/** A key of the keyboard, for the shortcuts. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
      {children}
    </kbd>
  );
}

/** Where something lives: Clientes › ficha › Fotos. */
export function Path({ parts }: { parts: string[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-0.5 align-middle text-sm text-slate-500">
      {parts.map((part, index) => (
        <span key={part} className="inline-flex items-center gap-0.5">
          {index > 0 && <ChevronRight className="size-3 shrink-0" />}
          <span className="font-medium text-slate-700">{part}</span>
        </span>
      ))}
    </span>
  );
}

/** A deep link into the app: the point of the whole guide. */
export function Where({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-brand-700 hover:text-brand-800 inline-flex items-center gap-1 font-medium underline decoration-dotted underline-offset-2"
    >
      {children}
      <ArrowRight className="size-3.5" />
    </Link>
  );
}

/** The one link that answers "and where do I do this?" for a whole section. */
export function OpenScreen({
  href,
  label,
  note,
}: {
  href: string;
  label: string;
  note?: string;
}) {
  return (
    <Link
      href={href}
      className="hover:border-brand-300 hover:bg-brand-50/40 my-3 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
    >
      <span className="min-w-0 flex-1">
        <span className="text-brand-700 block font-semibold">{label}</span>
        {note && (
          <span className="block text-sm text-slate-500">{note}</span>
        )}
      </span>
      <ArrowRight className="text-brand-600 size-4 shrink-0" />
    </Link>
  );
}

export function Note({
  kind = "tip",
  children,
}: {
  kind?: "tip" | "warn";
  children: React.ReactNode;
}) {
  const Icon = kind === "warn" ? TriangleAlert : Info;

  return (
    <p
      className={cn(
        "my-3 flex gap-2 rounded-lg border px-3 py-2 text-sm",
        kind === "warn"
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-slate-100 pt-6">
      <h2 className="mb-3 text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol className="my-3 space-y-2.5 border-l-2 border-slate-100 pl-4">
      {children}
    </ol>
  );
}

export function Step({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="text-slate-600">
      <span className="block font-medium text-slate-800">{title}</span>
      {children}
    </li>
  );
}

/** Body copy. Kept as a component so every guide breathes the same. */
export function P({ children }: { children: React.ReactNode }) {
  return <p className="my-3 text-slate-600">{children}</p>;
}

export function Bullets({ children }: { children: React.ReactNode }) {
  return (
    <ul className="my-3 list-disc space-y-1.5 pl-5 text-slate-600 marker:text-slate-300">
      {children}
    </ul>
  );
}
