"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { useSearch } from "@/hooks/use-search";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { flattenResults, moveSelection } from "@/lib/search/results";

/** Below this the server answers nothing, so the box says what it is waiting for. */
const MIN_QUERY = 2;

function PaletteList({
  items,
  selected,
  onHover,
  onPick,
}: {
  items: ReturnType<typeof flattenResults>;
  selected: number;
  onHover: (index: number) => void;
  onPick: (href: string) => void;
}) {
  return (
    <ul className="max-h-80 overflow-y-auto py-1">
      {items.map((item, index) => {
        return (
          <li key={item.key}>
            {item.startsGroup && (
              <p className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                {item.group}
              </p>
            )}
            <button
              type="button"
              onMouseEnter={() => onHover(index)}
              onClick={() => onPick(item.href)}
              aria-current={index === selected ? "true" : undefined}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-2 text-left",
                index === selected ? "bg-brand-50" : "hover:bg-slate-50",
              )}
            >
              <span className="truncate text-slate-800">{item.label}</span>
              {item.detail && (
                <span className="shrink-0 text-xs text-slate-400">
                  {item.detail}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Jump anywhere from one box. Opens with Ctrl+K — or ⌘K — from any screen of
 * the trainer's app.
 */
export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState(0);

  const { data, isFetching } = useSearch(term, isOpen);
  const items = flattenResults(data);

  const close = useCallback(() => {
    setOpen(false);
    setTerm("");
    setSelected(0);
  }, []);

  const pick = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!isOpen) {
    return null;
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      close();
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((current) =>
        moveSelection(
          current,
          event.key === "ArrowDown" ? 1 : -1,
          items.length,
        ),
      );
    }
    if (event.key === "Enter" && items[selected]) {
      pick(items[selected].href);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 pt-24"
      onClick={close}
      role="presentation"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search className="size-4 shrink-0 text-slate-400" />
          <input
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setSelected(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Buscar cliente, ejercicio, alimento, comida o menú"
            className="h-12 flex-1 text-slate-900 outline-none"
            autoFocus
          />
          {isFetching && <Spinner className="size-4" />}
        </div>

        {term.trim().length < MIN_QUERY ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            Escribe al menos dos letras.
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">
            {isFetching ? "Buscando…" : "Nada coincide con eso."}
          </p>
        ) : (
          <PaletteList
            items={items}
            selected={selected}
            onHover={setSelected}
            onPick={pick}
          />
        )}

        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
          ↑↓ para moverte · Enter para abrir · Esc para cerrar
        </p>
      </div>
    </div>
  );
}
