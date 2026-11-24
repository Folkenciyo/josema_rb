"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "./button";

interface FiltersToggleProps {
  open: boolean;
  onToggle: () => void;
  /** How many filters other than the search are set, shown while folded. */
  active: number;
  controls: string;
}

/**
 * On a phone a catalog's filters fold behind this button, so the search box
 * and the first results share the first screen. Above `sm` it is not drawn
 * and the filters stay in view.
 */
export function FiltersToggle({
  open,
  onToggle,
  active,
  controls,
}: FiltersToggleProps) {
  return (
    <Button
      variant="secondary"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      className="sm:hidden"
    >
      <SlidersHorizontal className="size-4" />
      Filtros
      {active > 0 && (
        <span className="bg-brand-600 rounded-full px-1.5 text-xs text-white">
          {active}
        </span>
      )}
    </Button>
  );
}
