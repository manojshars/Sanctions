import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "gold" | "success" | "danger" | "warning" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-line",
  brand: "bg-brand/10 text-brand border-brand/20",
  gold: "bg-gold-400/15 text-accent border-gold-400/30",
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  warning: "bg-warning/10 text-warning border-warning/25",
  outline: "bg-transparent text-muted border-line",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const tone: Tone = level === "BEGINNER" ? "success" : level === "INTERMEDIATE" ? "brand" : "warning";
  return <Badge tone={tone}>{level.charAt(0) + level.slice(1).toLowerCase()}</Badge>;
}

export function TierBadge({ tier }: { tier: string }) {
  return tier === "FREE" ? <Badge tone="success">Free</Badge> : <Badge tone="gold">Premium</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    PUBLISHED: "success", DRAFT: "neutral", IN_REVIEW: "warning", ARCHIVED: "outline",
    OPEN: "brand", IN_PROGRESS: "warning", AWAITING_USER: "gold", RESOLVED: "success", CLOSED: "outline",
    ACTIVE: "success", SUSPENDED: "danger", DELETED: "outline", CANCELED: "outline", EXPIRED: "outline", PAST_DUE: "danger",
    SUCCEEDED: "success", PENDING: "warning", FAILED: "danger", REFUNDED: "outline",
    NEW: "brand", APPROVED: "success", REJECTED: "danger", VALID: "success", REVOKED: "danger",
    LOW: "neutral", NORMAL: "brand", HIGH: "warning", URGENT: "danger",
  };
  const label = status === "AWAITING_USER" ? "Awaiting your response" : status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  return <Badge tone={map[status] ?? "neutral"}>{label}</Badge>;
}
