import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Bell } from "lucide-react";
import { requireUser, requireActionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };
export const dynamic = "force-dynamic";

async function markAllRead() {
  "use server";
  const user = await requireActionUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
}

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="container max-w-3xl py-10">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Notifications</h1>
        {items.some((i) => !i.readAt) && <form action={markAllRead}><Button type="submit" variant="secondary" size="sm">Mark all as read</Button></form>}</div>
      {items.length ? (
        <ul className="mt-6 space-y-2">{items.map((n) => (
          <li key={n.id} className={`card p-4 ${n.readAt ? "opacity-75" : "border-l-4 border-l-gold-400"}`}>
            <p className="font-semibold">{n.link ? <Link href={n.link} className="hover:text-brand">{n.title}</Link> : n.title}</p>
            <p className="text-sm text-muted">{n.body}</p><p className="mt-1 text-xs text-muted">{formatDate(n.createdAt)}</p>
          </li>))}</ul>
      ) : <EmptyState className="mt-6" icon={Bell} title="No notifications" />}
    </div>
  );
}
