"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Salad, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";
import { NAV_GROUPS, type NavItem } from "./nav-items";

/**
 * The menu has ten entries and a thumb reaches five. These are the four the
 * trainer opens standing in the gym; the rest live behind «Más», which opens
 * the same side menu as always.
 *
 * `covers` is what lights the tab up: a task tab stays lit anywhere inside its
 * group, so «Dieta» is still lit while you are in Alimentos or Comidas.
 */
interface Tab {
  href: string;
  /** Only when the tab names a task instead of the screen it opens. */
  label?: string;
  icon?: LucideIcon;
  covers: string[];
}

const TABS: Tab[] = [
  { href: "/dashboard", covers: ["/dashboard"] },
  { href: "/clients", covers: ["/clients"] },
  { href: "/routines", covers: ["/routines", "/exercises"] },
  {
    href: "/menus",
    label: "Dieta",
    icon: Salad,
    covers: ["/menus", "/foods", "/meal-templates"],
  },
];

const ITEM =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors";

export function BottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const items = new Map<string, NavItem>(
    NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => [item.href, item] as const),
    ),
  );

  return (
    <nav
      aria-label="Secciones"
      className="bg-surface/95 fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const item = items.get(tab.href);
          if (!item) return null;

          const Icon = tab.icon ?? item.icon;
          const isActive = tab.covers.some(
            (base) => pathname === base || pathname.startsWith(`${base}/`),
          );
          return (
            <li key={tab.href} className="flex flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  ITEM,
                  isActive
                    ? "text-brand-600"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                <Icon className="size-5" />
                {tab.label ?? item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button
            type="button"
            onClick={onOpenMenu}
            className={cn(ITEM, "text-slate-500 hover:text-slate-800")}
          >
            <Menu className="size-5" />
            Más
          </button>
        </li>
      </ul>
    </nav>
  );
}
