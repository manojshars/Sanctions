"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, ClipboardList, CreditCard, FileSearch, FileText, Inbox, Layers, LifeBuoy, Library, PlayCircle, ScrollText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, perm: "analytics" },
  { href: "/admin/courses", label: "Courses", icon: BookOpen, perm: "content" },
  { href: "/admin/questions", label: "Questions", icon: ClipboardList, perm: "content" },
  { href: "/admin/flashcards", label: "Flashcards", icon: Layers, perm: "content" },
  { href: "/admin/videos", label: "Videos", icon: PlayCircle, perm: "content" },
  { href: "/admin/materials", label: "Training materials", icon: FileText, perm: "content" },
  { href: "/admin/case-studies", label: "Case studies", icon: FileSearch, perm: "content" },
  { href: "/admin/content", label: "Knowledge & help", icon: Library, perm: "content" },
  { href: "/admin/users", label: "Users", icon: Users, perm: "users" },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, perm: "support" },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox, perm: "support" },
  { href: "/admin/memberships", label: "Memberships", icon: CreditCard, perm: "packages" },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText, perm: "audit" },
];

export function AdminNav({ perms }: { perms: string[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-0.5">
      {ITEMS.filter((i) => perms.includes(i.perm)).map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm", active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white")}>
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
