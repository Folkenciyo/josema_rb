import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const CONTROL_CLASSES =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 aria-[invalid=true]:border-red-400";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL_CLASSES, "h-10", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL_CLASSES, className)} rows={3} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL_CLASSES, "h-10", className)} {...props} />;
}
