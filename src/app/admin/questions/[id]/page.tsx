import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { AdminHeader, Flash, ActionButton, Table, Td } from "@/components/admin/ui";
import { QuestionForm } from "@/components/admin/question-form";
import { StatusBadge } from "@/components/ui/badge";
import { questionStatusAction, saveQuestionAction } from "@/server/actions/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Question" };

export default async function QuestionEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const user = await requirePermission("content:manage");
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const [topics, courses] = await Promise.all([db.topic.findMany({ orderBy: { order: "asc" } }), db.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } })]);
  const q = isNew ? null : await db.question.findUnique({ where: { id }, include: { options: { orderBy: { order: "asc" } }, versions: { orderBy: { version: "desc" }, include: { editedBy: { select: { name: true } } } }, author: { select: { name: true } } } });
  if (!isNew && !q) notFound();
  const stats = q ? await db.attemptItem.groupBy({ by: ["isCorrect"], where: { questionId: q.id, isCorrect: { not: null } }, _count: true }) : [];
  const attempts = stats.reduce((s, x) => s + x._count, 0);
  const correct = stats.find((x) => x.isCorrect)?._count ?? 0;
  const canPublish = can(user.role, "content:publish");
  return (
    <>
      <AdminHeader title={isNew ? "New question" : "Edit question"} back={{ href: "/admin/questions", label: "Questions" }}
        description={q ? `v${q.version} · author ${q.author?.name ?? "—"} · ${attempts} graded answers${attempts ? ` · ${Math.round((correct / attempts) * 100)}% correct` : ""}` : "New questions are saved as drafts for review."}
        actions={q && <><StatusBadge status={q.status} />
          {q.status === "DRAFT" && <ActionButton action={questionStatusAction.bind(null, q.id, "IN_REVIEW")} label="Submit for review" />}
          {canPublish && (q.status === "IN_REVIEW" || q.status === "DRAFT") && <ActionButton action={questionStatusAction.bind(null, q.id, "PUBLISHED")} label="Publish" tone="primary" />}
          {q.status === "IN_REVIEW" && <ActionButton action={questionStatusAction.bind(null, q.id, "DRAFT")} label="Return to draft" />}
          {q.status === "PUBLISHED" && <ActionButton action={questionStatusAction.bind(null, q.id, "DRAFT")} label="Unpublish" />}
          {q.status !== "ARCHIVED" && <ActionButton action={questionStatusAction.bind(null, q.id, "ARCHIVED")} label="Archive" tone="danger" />}
          {q.status === "ARCHIVED" && <ActionButton action={questionStatusAction.bind(null, q.id, "DRAFT")} label="Restore" />}</>} />
      <Flash sp={sp} />
      <QuestionForm action={saveQuestionAction.bind(null, q?.id ?? null)} isNew={isNew} topics={topics} courses={courses} q={q ?? undefined} />
      {q && q.versions.length > 0 && (
        <section className="mt-8"><h2 className="mb-3 font-semibold">Version history</h2>
          <Table head={["Version", "Edited by", "Date", "Note", "Snapshot"]}>{q.versions.map((v) => <tr key={v.id}><Td>v{v.version}</Td><Td>{v.editedBy?.name ?? "—"}</Td><Td>{formatDate(v.createdAt)}</Td><Td>{v.note}</Td><Td><details><summary className="cursor-pointer text-brand">View</summary><pre className="mt-2 max-h-64 max-w-xl overflow-auto rounded bg-surface-2 p-2 text-[11px]">{JSON.stringify(v.snapshot, null, 2)}</pre></details></Td></tr>)}</Table>
        </section>
      )}
    </>
  );
}
