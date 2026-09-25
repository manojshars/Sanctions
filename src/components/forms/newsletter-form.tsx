"use client";
import { subscribeNewsletterAction } from "@/server/actions/public";
import { useFormAction } from "./use-action";
import { SubmitButton } from "./submit-button";
import { cn } from "@/lib/utils";

export function NewsletterForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [state, action] = useFormAction(subscribeNewsletterAction);
  const dark = variant === "dark";
  if (state.ok) return <p role="status" className={cn("text-sm", dark ? "text-gold-200" : "text-success")}>{state.message}</p>;
  return (
    <form action={action} className="space-y-2.5" noValidate>
      <div className="flex gap-2">
        <label htmlFor={`nl-${variant}`} className="sr-only">Email address</label>
        <input id={`nl-${variant}`} name="email" type="email" required autoComplete="email" placeholder="you@company.com"
          className={cn("input", dark && "border-white/15 bg-white/5 text-white placeholder:text-white/40")} />
        <SubmitButton variant="gold" pendingText="…">Subscribe</SubmitButton>
      </div>
      <label className={cn("flex items-start gap-2 text-xs", dark ? "text-white/65" : "text-muted")}>
        <input type="checkbox" name="consent" className="mt-0.5 accent-[#D6B66B]" required />
        <span>I agree to receive the newsletter by email and can unsubscribe at any time. See our <a href="/privacy" className="underline">Privacy Policy</a>.</span>
      </label>
      {state.error && <p role="alert" className={cn("text-xs font-medium", dark ? "text-red-300" : "text-danger")}>{state.error}</p>}
    </form>
  );
}
