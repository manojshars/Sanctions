import Link from "next/link";
import { Award, Clock, Layers } from "lucide-react";
import { LevelBadge, TierBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/feedback";
import { TopicIcon } from "@/lib/topic-icons";
import { formatDuration } from "@/lib/utils";

export type CourseCardData = {
  slug: string; title: string; subtitle: string; level: string; durationMinutes: number; accessTier: string;
  hasCertificate: boolean; topic: { slug: string; name: string }; _count?: { modules: number };
};

export function CourseCard({ course, progress, enrolled }: { course: CourseCardData; progress?: number; enrolled?: boolean }) {
  return (
    <article className="card card-hover group relative flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-brand"><TopicIcon slug={course.topic.slug} className="h-3.5 w-3.5" /></span>
          {course.topic.name}
        </span>
        <TierBadge tier={course.accessTier} />
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-ink">
        <Link href={`/academy/courses/${course.slug}`} className="after:absolute after:inset-0 group-hover:text-brand">
          {course.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{course.subtitle}</p>
      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
          <LevelBadge level={course.level} />
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{formatDuration(course.durationMinutes)}</span>
          {course._count && <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" aria-hidden />{course._count.modules} modules</span>}
          {course.hasCertificate && <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5 text-accent" aria-hidden />Certificate</span>}
        </div>
        {enrolled && progress !== undefined && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-muted"><span>Progress</span><span>{progress}%</span></div>
            <Progress value={progress} tone="gold" label={`${course.title} progress`} />
          </div>
        )}
      </div>
    </article>
  );
}
