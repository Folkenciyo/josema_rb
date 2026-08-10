"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Home, Salad, Scale } from "lucide-react";

import { cn } from "@/lib/cn";
import { portalPath } from "@/types/portal";

const ITEMS = [
  { segment: "", label: "Inicio", Icon: Home },
  { segment: "/rutina", label: "Rutina", Icon: Dumbbell },
  { segment: "/dieta", label: "Dieta", Icon: Salad },
  { segment: "/peso", label: "Peso", Icon: Scale },
] as const;

export function PortalNav({ token }: { token: string }) {
  const pathname = usePathname();
  const base = portalPath(token);

  return (
    <nav className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map(({ segment, label, Icon }) => {
          const href = `${base}${segment}`;
          const isActive = pathname === href;

          return (
            <li key={label} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-amber-600"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
