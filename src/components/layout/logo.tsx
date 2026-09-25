import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden>
      <defs>
        <linearGradient id="fca-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8D39A" />
          <stop offset="1" stopColor="#C49F48" />
        </linearGradient>
      </defs>
      <path d="M20 2.5 34.5 8v11.2c0 9.1-6.1 15.6-14.5 18.3C11.6 34.8 5.5 28.3 5.5 19.2V8L20 2.5Z" fill="#0B1426" stroke="url(#fca-g)" strokeWidth="1.6" />
      <path d="M14 12.5h12.5M14 12.5v16M14 20h9" stroke="url(#fca-g)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="26.5" cy="26" r="3.2" fill="none" stroke="#D6B66B" strokeWidth="1.6" />
      <path d="m28.8 28.3 2.4 2.4" stroke="#D6B66B" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="FinCrime Academy — home">
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-extrabold tracking-[0.08em] text-ink">FINCRIME</span>
          <span className="mt-0.5 text-[10px] font-semibold tracking-[0.32em] text-accent">ACADEMY</span>
        </span>
      )}
    </Link>
  );
}
