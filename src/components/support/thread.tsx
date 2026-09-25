import { Paperclip } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

type Msg = { id: string; body: string; isInternal: boolean; createdAt: Date; author: { id: string; name: string; role: string }; attachments: { id: string; filename: string; size: number }[] };

export function TicketThread({ messages, requesterId }: { messages: Msg[]; requesterId: string }) {
  return (
    <ol className="space-y-4">
      {messages.map((m) => {
        const mine = m.author.id === requesterId;
        return (
          <li key={m.id} className={cn("card p-5", m.isInternal && "border-warning/50 bg-warning/5", !mine && !m.isInternal && "border-l-4 border-l-gold-400")}>
            <p className="text-sm font-semibold">{m.author.name}{!mine && <span className="ml-2 text-xs font-normal text-muted">{m.isInternal ? "Internal note" : "Support team"}</span>}<span className="ml-2 text-xs font-normal text-muted">{formatDate(m.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink/90">{m.body}</p>
            {m.attachments.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{m.attachments.map((a) => <li key={a.id}><a href={`/support-files/${a.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs hover:bg-surface-2"><Paperclip className="h-3.5 w-3.5" />{a.filename} ({Math.ceil(a.size / 1024)} KB)</a></li>)}</ul>}
          </li>
        );
      })}
    </ol>
  );
}
