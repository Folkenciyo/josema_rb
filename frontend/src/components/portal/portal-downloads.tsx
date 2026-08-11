"use client";

import { Download } from "lucide-react";

import { portalExportHref, type PortalPlanKind } from "@/lib/api/portal";

/** Plain links: the browser handles the download, so it works offline-ish and on iOS. */
export function PortalDownloads({
  token,
  plan,
}: {
  token: string;
  plan: PortalPlanKind;
}) {
  return (
    <div className="flex gap-2">
      {(["pdf", "docx"] as const).map((format) => (
        <a
          key={format}
          href={portalExportHref(token, plan, format)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <Download className="size-4" />
          {format === "pdf" ? "PDF" : "Word"}
        </a>
      ))}
    </div>
  );
}
