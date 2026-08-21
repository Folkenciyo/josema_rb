import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HELP_GUIDES, guideHref } from "@/lib/help/guides";

/** The table of contents: every guide, with the screens it talks about. */
export function HelpIndexView() {
  return (
    <>
      <PageHeader
        title="Guía de uso"
        description="Cómo funciona cada parte de la aplicación, con enlaces directos a la pantalla que se explica."
      />

      <div className="grid gap-3 md:grid-cols-2">
        {HELP_GUIDES.map(({ slug, title, summary, icon: Icon, screens }) => (
          <Card key={slug} className="flex flex-col gap-3 p-4">
            <Link href={guideHref(slug)} className="group flex items-start gap-3">
              <span className="bg-brand-100 text-brand-600 flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="group-hover:text-brand-700 block font-semibold text-slate-800">
                  {title}
                </span>
                <span className="mt-0.5 block text-sm text-slate-500">
                  {summary}
                </span>
              </span>
              <ArrowRight className="group-hover:text-brand-600 mt-1 size-4 shrink-0 text-slate-300" />
            </Link>

            {screens.length > 0 && (
              <p className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-400">
                <span className="py-0.5">Pantallas:</span>
                {screens.map((screen) => (
                  <Link
                    key={screen.href}
                    href={screen.href}
                    className="hover:border-brand-300 hover:text-brand-700 rounded border border-slate-200 px-1.5 py-0.5 text-slate-500"
                  >
                    {screen.label}
                  </Link>
                ))}
              </p>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
