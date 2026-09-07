"use client";

import { useState } from "react";

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
  const [largePrint, setLargePrint] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {(["pdf", "docx"] as const).map((format) => (
          <a
            key={format}
            href={portalExportHref(token, plan, format, {
              largePrint: format === "pdf" && largePrint,
            })}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Download className="size-4" />
            {format === "pdf" ? "PDF" : "Word"}
          </a>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={largePrint}
          onChange={(event) => setLargePrint(event.target.checked)}
          className="size-4 rounded border-slate-300"
        />
        PDF con letra grande (personas mayores)
      </label>
    </div>
  );
}
