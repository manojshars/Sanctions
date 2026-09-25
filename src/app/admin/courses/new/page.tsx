import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { CourseForm } from "@/components/admin/course-form";
import { saveCourseAction } from "@/server/actions/admin";

export const metadata = { title: "New course" };

export default async function NewCourse({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  const topics = await db.topic.findMany({ orderBy: { order: "asc" } });
  return (<><AdminHeader title="New course" back={{ href: "/admin/courses", label: "Courses" }} description="Courses are created as drafts. Add modules and lessons, then publish." /><Flash sp={sp} /><CourseForm action={saveCourseAction.bind(null, null)} topics={topics} /></>);
}
