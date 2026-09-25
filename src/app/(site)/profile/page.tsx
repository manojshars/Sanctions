import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getEntitlements, tierLabel } from "@/lib/entitlements";
import { ProfileForm } from "@/components/account/account-forms";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireUser("/profile");
  const [user, topics, ent, certs, enrolls] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.id } }), db.topic.findMany({ orderBy: { order: "asc" }, select: { slug: true, name: true } }),
    getEntitlements(session), db.certificate.count({ where: { userId: session.id } }), db.enrollment.count({ where: { userId: session.id } }),
  ]);
  return (
    <div className="container grid max-w-5xl gap-8 py-10 lg:grid-cols-[1fr_300px]">
      <div>
        <p className="eyebrow">Your profile</p>
        <h1 className="mt-1 text-3xl font-bold">{user.name}</h1>
        {user.headline && <p className="text-muted">{user.headline}</p>}
        <div className="card mt-6 p-6"><ProfileForm user={user} topics={topics} /></div>
      </div>
      <aside className="card self-start p-5 text-sm">
        <dl className="space-y-3">
          <div><dt className="text-muted">Membership</dt><dd className="font-semibold">{tierLabel(ent)}</dd></div>
          <div><dt className="text-muted">Member since</dt><dd className="font-semibold">{formatDate(user.createdAt)}</dd></div>
          <div><dt className="text-muted">Courses enrolled</dt><dd className="font-semibold">{enrolls}</dd></div>
          <div><dt className="text-muted">Certificates</dt><dd className="font-semibold">{certs}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
