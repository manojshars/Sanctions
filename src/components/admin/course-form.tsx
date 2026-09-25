import { L, SubmitBar } from "./ui";
import { Input, Select, Textarea } from "@/components/ui/form";

type C = { title: string; subtitle: string; overview: string; topicId: string; level: string; format: string; accessTier: string; durationMinutes: number; hasCertificate: boolean; passingScore: number; maxAttempts: number; cpdHours: number | null; keywords: string[]; objectives: { text: string }[] };

export function CourseForm({ action, course, topics }: { action: (f: FormData) => Promise<void>; course?: C; topics: { id: string; name: string }[] }) {
  return (
    <form action={action} className="card space-y-4 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <L label="Title" htmlFor="title"><Input id="title" name="title" defaultValue={course?.title} required /></L>
        <L label="Subtitle" htmlFor="subtitle"><Input id="subtitle" name="subtitle" defaultValue={course?.subtitle} required /></L>
      </div>
      <L label="Overview" htmlFor="overview"><Textarea id="overview" name="overview" defaultValue={course?.overview} required /></L>
      <L label="Learning objectives" htmlFor="objectives" hint="One per line"><Textarea id="objectives" name="objectives" defaultValue={course?.objectives.map((o) => o.text).join("\n")} /></L>
      <div className="grid gap-4 md:grid-cols-4">
        <L label="Topic" htmlFor="topicId"><Select id="topicId" name="topicId" defaultValue={course?.topicId}>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></L>
        <L label="Level" htmlFor="level"><Select id="level" name="level" defaultValue={course?.level ?? "BEGINNER"}><option>BEGINNER</option><option>INTERMEDIATE</option><option>ADVANCED</option></Select></L>
        <L label="Format" htmlFor="format"><Select id="format" name="format" defaultValue={course?.format ?? "SELF_PACED"}><option>SELF_PACED</option><option>BLENDED</option><option>READING</option><option>VIDEO</option></Select></L>
        <L label="Access" htmlFor="accessTier"><Select id="accessTier" name="accessTier" defaultValue={course?.accessTier ?? "PREMIUM"}><option>FREE</option><option>PREMIUM</option></Select></L>
        <L label="Duration (minutes)" htmlFor="durationMinutes"><Input id="durationMinutes" name="durationMinutes" type="number" min={5} defaultValue={course?.durationMinutes ?? 60} /></L>
        <L label="Passing score %" htmlFor="passingScore"><Input id="passingScore" name="passingScore" type="number" min={1} max={100} defaultValue={course?.passingScore ?? 70} /></L>
        <L label="Max final attempts" htmlFor="maxAttempts"><Input id="maxAttempts" name="maxAttempts" type="number" min={1} max={20} defaultValue={course?.maxAttempts ?? 3} /></L>
        <L label="CPD hours (optional)" htmlFor="cpdHours"><Input id="cpdHours" name="cpdHours" type="number" step="0.5" min={0} defaultValue={course?.cpdHours ?? ""} /></L>
      </div>
      <L label="Keywords" htmlFor="keywords" hint="Comma separated"><Input id="keywords" name="keywords" defaultValue={course?.keywords.join(", ")} /></L>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="hasCertificate" defaultChecked={course?.hasCertificate ?? true} /> Issues a completion certificate (requires passing the final assessment)</label>
      <SubmitBar label={course ? "Save course" : "Create course"} />
    </form>
  );
}
