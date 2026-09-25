import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export function Field({ label, htmlFor, hint, error, children, className, required }: {
  label: string; htmlFor: string; hint?: string; error?: string | string[]; children: React.ReactNode; className?: string; required?: boolean;
}) {
  const err = Array.isArray(error) ? error[0] : error;
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !err && <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>}
      {err && <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs font-medium text-danger">{err}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn("input", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn("input min-h-[120px]", className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...p }, ref) {
  return (
    <select ref={ref} className={cn("input appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%237B8599'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")" }}
      {...p}>
      {children}
    </select>
  );
});

export function Checkbox({ label, className, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-ink", className)}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-line text-brand accent-[#193B68] focus-visible:ring-2 focus-visible:ring-gold-400" {...p} />
      <span>{label}</span>
    </label>
  );
}
