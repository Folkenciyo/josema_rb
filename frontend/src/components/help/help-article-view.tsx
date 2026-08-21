import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { GUIDE_BODIES } from "./guides";
import {
  guideHref,
  guideNeighbours,
  type HelpGuide,
} from "@/lib/help/guides";

/** One guide, with its screens up top and the neighbouring ones at the foot. */
export function HelpArticleView({ guide }: { guide: HelpGuide }) {
  const Body = GUIDE_BODIES[guide.slug];
  const { previous, next } = guideNeighbours(guide.slug);

  return (
    <>
      <Link
        href="/ayuda"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="size-4" />
        Guía de uso
      </Link>

      <PageHeader title={guide.title} description={guide.summary} />

      {guide.screens.length > 0 && (
        <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          Ir a:
          {guide.screens.map((screen) => (
            <Link
              key={screen.href}
              href={screen.href}
              className="hover:border-brand-300 hover:text-brand-700 rounded-lg border border-slate-200 px-2 py-1 font-medium text-slate-600"
            >
              {screen.label}
            </Link>
          ))}
        </p>
      )}

      <Card className="px-5 py-4 md:px-7 md:py-6">
        <article className="max-w-2xl space-y-1">
          {Body ? <Body /> : null}
        </article>
      </Card>

      <nav className="mt-4 flex flex-wrap gap-3">
        {previous && (
          <Link
            href={guideHref(previous.slug)}
            className="hover:border-brand-300 flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-4 py-3"
          >
            <ChevronLeft className="size-4 shrink-0 text-slate-400" />
            <span className="min-w-0">
              <span className="block text-xs text-slate-400">Anterior</span>
              <span className="block truncate font-medium text-slate-700">
                {previous.title}
              </span>
            </span>
          </Link>
        )}
        {next && (
          <Link
            href={guideHref(next.slug)}
            className="hover:border-brand-300 flex min-w-0 flex-1 items-center justify-end gap-2 rounded-xl border border-slate-200 px-4 py-3 text-right"
          >
            <span className="min-w-0">
              <span className="block text-xs text-slate-400">Siguiente</span>
              <span className="block truncate font-medium text-slate-700">
                {next.title}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-slate-400" />
          </Link>
        )}
      </nav>
    </>
  );
}
