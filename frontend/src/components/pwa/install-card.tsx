"use client";

import { Download, Share } from "lucide-react";

import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Invitation to install the app. It disappears for good once the app runs from
 * the home screen, and it never shows on browsers that cannot install at all.
 */
export function InstallCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { isStandalone, isIOS, canInstall, promptInstall } = useInstallPrompt();

  if (isStandalone || (!canInstall && !isIOS)) {
    return null;
  }

  return (
    <Card className="px-5 py-4">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      {canInstall ? (
        <Button className="mt-3" onClick={() => void promptInstall()}>
          <Download className="size-4" />
          Instalar
        </Button>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
          Toca
          <Share className="size-4 shrink-0 text-slate-500" aria-hidden />
          <span className="sr-only">Compartir</span>y luego «Añadir a pantalla
          de inicio».
        </p>
      )}
    </Card>
  );
}
