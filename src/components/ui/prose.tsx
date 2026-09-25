import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export function Prose({ markdown, className }: { markdown: string; className?: string }) {
  return <div className={cn("prose-fca", className)} dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />;
}
