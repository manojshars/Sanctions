import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";
const tones: Record<Tone, { cls: string; icon: LucideIcon }> = {
  info: { cls: "border-brand/20 bg-brand/5 text-ink", icon: Info },
  success: { cls: "border-success/25 bg-success/5 text-ink", icon: CheckCircle2 },
  warning: { cls: "border-warning/30 bg-warning/5 text-ink", icon: TriangleAlert },
  danger: { cls: "border-danger/25 bg-danger/5 text-ink", icon: AlertCircle },
};
const iconTone: Record<Tone, string> = { info: "text-brand", success: "text-success", warning: "text-warning", danger: "text-danger" };

export function Alert({ tone = "info", title, children, className }: { tone?: Tone; title?: string; children?: React.ReactNode; className?: string }) {
  const { cls, icon: Icon } = tones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border p-4 text-sm", cls, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconTone[tone])} aria-hidden />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-ink/80">{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }: { icon?: LucideIcon; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-gold-400/15 text-accent">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Progress({ value, label, className, tone = "brand" }: { value: number; label?: string; className?: string; tone?: "brand" | "gold" | "success" }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const bar = tone === "gold" ? "bg-gold-400" : tone === "success" ? "bg-success" : "bg-brand";
  return (
    <div className={className}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-line" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}>
        <div className={cn("h-full rounded-full transition-all duration-500", bar)} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function Ring({ value, size = 88, stroke = 8, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? "Score"}: ${Math.round(v)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-2" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" className="stroke-gold-400 transition-all duration-700"
          strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} />
      </svg>
      <span className="absolute font-display text-lg font-bold text-ink">{Math.round(v)}%</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-2", className)} aria-hidden />;
}

export function Stat({ label, value, hint, icon: Icon }: { label: string; value: React.ReactNode; hint?: string; icon?: LucideIcon }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-accent" aria-hidden />}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
