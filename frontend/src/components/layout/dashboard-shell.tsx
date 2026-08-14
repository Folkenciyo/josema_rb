"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";

import { useCurrentTrainer, useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/cn";
import { CommandPalette } from "@/components/search/command-palette";
import { BrandWordmark } from "@/components/ui/brand-logo";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";

function Brand() {
  return (
    <Link href="/dashboard" aria-label="JOSEMA RB">
      <BrandWordmark className="h-7 w-auto" preload />
    </Link>
  );
}

function SidebarFooter() {
  const { data: trainer } = useCurrentTrainer();
  const logout = useLogout();

  return (
    <div className="mt-auto border-t border-white/10 pt-4">
      <ThemeToggle />
      <p className="mt-3 truncate px-3 text-xs text-slate-400">
        {trainer?.email}
      </p>
      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        <LogOut className="size-4" />
        Cerrar sesión
      </button>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "bg-inverse fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6 p-4 transition-transform lg:translate-x-0",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-3">
          <Brand />
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileNavOpen(false)}
            className="text-slate-400 lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>
        <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        <SidebarFooter />
      </aside>

      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="bg-surface flex items-center gap-3 border-b border-slate-200 px-4 py-3 lg:hidden">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMobileNavOpen(true)}
            className="text-slate-600"
          >
            <Menu className="size-6" />
          </button>
          <BrandWordmark className="h-6 w-auto" />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
      </div>

      <CommandPalette />
    </div>
  );
}
