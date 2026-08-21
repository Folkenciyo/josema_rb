"use client";

import { Eye } from "lucide-react";

import { RichText } from "@/components/ui/rich-text";
import { Textarea } from "@/components/ui/input";

const PLACEHOLDER = `Hola, bienvenido.

Antes de empezar necesito conocerte un poco. Son cinco minutos y me sirven para **no ponerte ejercicios que te hagan daño**.

Si algo no lo sabes seguro, déjalo en blanco y lo hablamos.`;

/** The four marks the light markup understands, with an example of each. */
const LEGEND = [
  { code: "**importante**", label: "negrita", render: "importante" },
  { code: "*matiz*", label: "cursiva", render: "matiz" },
  { code: "- Agua", label: "lista", render: "Agua" },
  { code: "Línea en blanco", label: "párrafo nuevo", render: null },
];

/**
 * The introduction the client reads above the questions. The legend sits right
 * next to the box on purpose: nobody remembers markup they use once a year.
 */
export function IntroEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="border-b border-slate-100 px-5 py-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Introducción
        </span>
        <span className="mb-2 block text-xs text-slate-500">
          Unos párrafos que el cliente lee encima de las preguntas. Déjalo vacío
          y el cuestionario empieza directamente por la primera.
        </span>
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={8}
          placeholder={PLACEHOLDER}
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="font-medium text-slate-600">Puedes usar:</span>
        {LEGEND.map(({ code, label, render }) => (
          <span key={code} className="inline-flex items-center gap-1.5">
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-700">
              {code}
            </code>
            <span>
              →{" "}
              {render === null ? (
                label
              ) : (
                <>
                  {label === "negrita" && <strong>{render}</strong>}
                  {label === "cursiva" && <em>{render}</em>}
                  {label === "lista" && <span>• {render}</span>}
                </>
              )}
            </span>
          </span>
        ))}
      </div>

      {value.trim() !== "" && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <Eye className="size-3.5" />
            Así lo verá
          </p>
          <RichText text={value} className="text-sm" />
        </div>
      )}
    </div>
  );
}
