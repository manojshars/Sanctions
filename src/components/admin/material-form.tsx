import { L, SubmitBar } from "./ui";
import { PdfInput } from "./pdf-input";
import { Input, Select, Textarea } from "@/components/ui/form";

type M = { title: string; description: string | null; courseId: string | null; topicId: string | null; accessTier: string; isPublished: boolean; storageKey: string | null };

export function MaterialForm({ action, m, courses, topics, defaultCourseId, direct }: {
  action: (f: FormData) => Promise<void>; m?: M; direct?: boolean; courses: { id: string; title: string }[]; topics: { id: string; name: string }[]; defaultCourseId?: string;
}) {
  return (
    <form action={action} className="card space-y-4 p-5">
      <L label={m ? "Replace PDF (optional)" : "PDF file"} htmlFor="file" hint="PDF only, up to 25 MB. Files with scripts, launch actions or embedded attachments are rejected.">
        <PdfInput required={!m} direct={direct} />
      </L>
      <L label="Title" htmlFor="title"><Input id="title" name="title" defaultValue={m?.title} required minLength={3} maxLength={160} /></L>
      <L label="Description" htmlFor="description" hint="Shown to learners next to the download."><Textarea id="description" name="description" defaultValue={m?.description ?? ""} maxLength={1000} className="min-h-[80px]" /></L>
      <div className="grid gap-4 md:grid-cols-2">
        <L label="Course" htmlFor="courseId" hint="Course materials are downloadable by enrolled learners.">
          <Select id="courseId" name="courseId" defaultValue={m ? (m.courseId ?? "") : (defaultCourseId ?? "")}>
            <option value="">None — standalone library item</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </Select>
        </L>
        <L label="Topic (standalone items)" htmlFor="topicId" hint="Required when no course is selected; ignored otherwise.">
          <Select id="topicId" name="topicId" defaultValue={m?.topicId ?? ""}>
            <option value="">—</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </L>
        <L label="Access" htmlFor="accessTier" hint="Premium downloads need a plan or package that includes downloads.">
          <Select id="accessTier" name="accessTier" defaultValue={m?.accessTier ?? "PREMIUM"}><option>FREE</option><option>PREMIUM</option></Select>
        </L>
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="isPublished" defaultChecked={m ? m.isPublished : true} /> Published (visible to learners)</label>
      </div>
      <SubmitBar label={m ? "Save material" : "Upload material"} />
    </form>
  );
}
