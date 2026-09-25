import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { CaseForm } from "@/components/admin/case-form";
import { saveCaseAction } from "@/server/actions/admin";

export const metadata = { title: "Case study" };

export default async function AdminCase({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const { id } = await params;
  const sp = await searchParams;
  const topics = await db.topic.findMany({ orderBy: { order: "asc" } });
  const c = id === "new" ? null : await db.caseStudy.findUnique({ where: { id } });
  if (id !== "new" && !c) notFound();
  return (<><AdminHeader title={c ? c.title : "New case study"} back={{ href: "/admin/case-studies", label: "Case studies" }} /><Flash sp={sp} /><CaseForm action={saveCaseAction.bind(null, c?.id ?? null)} c={c ?? undefined} topics={topics} /></>);
}
