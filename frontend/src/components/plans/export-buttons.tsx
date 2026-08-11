import { FileDown } from "lucide-react";

interface ExportButtonsProps {
  /** Base path of the plan's export endpoints, e.g. `/api/training-plans/{id}`. */
  basePath: string;
}

const LINK_CLASSES =
  "inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-surface px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100";

/** Plain links: the export endpoints stream a file and the session cookie rides along. */
export function ExportButtons({ basePath }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <a href={`${basePath}/export/pdf`} download className={LINK_CLASSES}>
        <FileDown className="size-4" />
        PDF
      </a>
      <a href={`${basePath}/export/docx`} download className={LINK_CLASSES}>
        <FileDown className="size-4" />
        Word
      </a>
    </div>
  );
}
