"use client";

import { useEffect, useState } from "react";
import { Timer, X } from "lucide-react";

import { Button } from "@/components/ui/button";

function format(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Counts the rest down after a set is ticked off. It is a nudge, not a rule:
 * the client can skip it, and nothing waits on it finishing.
 */
export function RestTimer({
  seconds,
  onDone,
}: {
  seconds: number;
  onDone: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const tick = setInterval(() => {
      setLeft((remaining) => Math.max(remaining - 1, 0));
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (left === 0) {
      onDone();
    }
  }, [left, onDone]);

  return (
    <div className="sticky bottom-16 z-10 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg">
      <Timer className="size-5 shrink-0 text-amber-400" />
      <span className="flex-1 text-sm">
        Descanso <span className="font-mono text-lg">{format(left)}</span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="text-slate-300 hover:bg-slate-800 hover:text-white"
        onClick={onDone}
      >
        <X className="size-4" />
        Saltar
      </Button>
    </div>
  );
}
