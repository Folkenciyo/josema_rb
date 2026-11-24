import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

// Full width by default, at zero specificity: `cn` only joins classes, so a
// plain `w-full` here beat a caller's `w-24` or `w-auto` whenever the CSS
// happened to emit it later, and every filter stretched across the page.
const CONTROL_CLASSES =
  "[:where(&)]:w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 aria-[invalid=true]:border-red-400 max-sm:text-base";

// Under `sm` a field is a 44px target, and its text 16px: below that iOS zooms
// the whole page in on focus and leaves it there.
const CONTROL_HEIGHT = "h-10 max-sm:h-11";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(CONTROL_CLASSES, CONTROL_HEIGHT, className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(CONTROL_CLASSES, className)} rows={3} {...props} />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(CONTROL_CLASSES, CONTROL_HEIGHT, className)}
      {...props}
    />
  );
}
