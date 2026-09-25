import { L, SubmitBar } from "./ui";
import { Input, Select, Textarea } from "@/components/ui/form";

type V = { youtubeId: string; title: string; channelName: string; channelUrl: string | null; description: string; durationSeconds: number | null; topicId: string; difficulty: string; accessTier: string; objectives: string[]; courseId: string | null; status: string };

export function VideoForm({ action, v, topics, courses }: { action: (f: FormData) => Promise<void>; v?: V; topics: { id: string; name: string }[]; courses: { id: string; title: string }[] }) {
  return (
    <form action={action} className="card space-y-4 p-5">
      <L label="YouTube URL or video ID" htmlFor="url" hint="The ID is validated and checked against YouTube's oEmbed endpoint."><Input id="url" name="url" defaultValue={v ? `https://www.youtube.com/watch?v=${v.youtubeId}` : ""} required /></L>
      <div className="grid gap-4 md:grid-cols-2">
        <L label="Title" htmlFor="title" hint="Leave blank to use the title from YouTube."><Input id="title" name="title" defaultValue={v?.title} /></L>
        <L label="Source channel" htmlFor="channelName" hint="Leave blank to use the channel from YouTube."><Input id="channelName" name="channelName" defaultValue={v?.channelName} /></L>
        <L label="Channel URL" htmlFor="channelUrl"><Input id="channelUrl" name="channelUrl" type="url" defaultValue={v?.channelUrl ?? ""} /></L>
        <L label="Duration (minutes)" htmlFor="durationMinutes"><Input id="durationMinutes" name="durationMinutes" type="number" min={1} defaultValue={v?.durationSeconds ? Math.round(v.durationSeconds / 60) : ""} /></L>
      </div>
      <L label="Description" htmlFor="description"><Textarea id="description" name="description" defaultValue={v?.description} required /></L>
      <L label="Learning objectives" htmlFor="objectives" hint="One per line"><Textarea id="objectives" name="objectives" defaultValue={v?.objectives.join("\n")} className="min-h-[70px]" /></L>
      <div className="grid gap-4 md:grid-cols-5">
        <L label="Topic" htmlFor="topicId"><Select id="topicId" name="topicId" defaultValue={v?.topicId}>{topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></L>
        <L label="Difficulty" htmlFor="difficulty"><Select id="difficulty" name="difficulty" defaultValue={v?.difficulty ?? "BEGINNER"}><option>BEGINNER</option><option>INTERMEDIATE</option><option>ADVANCED</option></Select></L>
        <L label="Access" htmlFor="accessTier"><Select id="accessTier" name="accessTier" defaultValue={v?.accessTier ?? "FREE"}><option>FREE</option><option>PREMIUM</option></Select></L>
        <L label="Related course" htmlFor="courseId"><Select id="courseId" name="courseId" defaultValue={v?.courseId ?? ""}><option value="">None</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</Select></L>
        <L label="Status" htmlFor="status"><Select id="status" name="status" defaultValue={v?.status ?? "DRAFT"}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></Select></L>
      </div>
      <label className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm"><input type="checkbox" name="manuallyVerified" className="mt-0.5" /> <span>I have personally verified this video ID, its title and its source channel on YouTube. (Required to publish only if the automatic YouTube check cannot be performed.)</span></label>
      <SubmitBar label={v ? "Save video" : "Add video"} />
    </form>
  );
}
