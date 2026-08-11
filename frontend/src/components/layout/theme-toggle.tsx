"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/cn";
import {
  getServerSnapshot,
  getSnapshot,
  setTheme,
  subscribe,
} from "@/lib/theme/theme-store";
import type { Theme } from "@/lib/theme/theme";

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "system", label: "Automático", Icon: Monitor },
];

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      className="flex gap-1 rounded-lg bg-white/10 p-1"
      role="radiogroup"
      aria-label="Tema"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => setTheme(value)}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md py-1.5 transition-colors",
            theme === value
              ? "bg-white/20 text-white"
              : "text-slate-400 hover:text-white",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
