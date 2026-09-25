import {
  Banknote, Ban, ShieldAlert, Scale, UserCheck, Activity, Search, Ship, PackageSearch, Bitcoin, Landmark, BookOpen, type LucideIcon,
} from "lucide-react";

export const TOPIC_ICONS: Record<string, LucideIcon> = {
  "aml-ctf": Banknote,
  sanctions: Ban,
  fraud: ShieldAlert,
  abc: Scale,
  "kyc-cdd": UserCheck,
  "transaction-monitoring": Activity,
  investigations: Search,
  "trade-based": Ship,
  "export-controls": PackageSearch,
  crypto: Bitcoin,
  governance: Landmark,
};

export function TopicIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = TOPIC_ICONS[slug] ?? BookOpen;
  return <Icon className={className} aria-hidden />;
}
